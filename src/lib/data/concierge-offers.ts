import { hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerProfileForUser } from "@/lib/data/profiles";
import { createOffer, getOfferByIdForAdmin } from "@/lib/data/offers";
import { createRequestToBook } from "@/lib/data/booking-requests";
import { getAdminActorId, recordAdminActionEvent } from "@/lib/data/operator-tasks";
import { sendAlertLifecycleEmail } from "@/lib/notifications";
import { toCustomerConciergeOffer, toGeographyPoint } from "@/lib/data/mappers";
import type { CustomerConciergeOffer } from "@/types/alert";
import type { ConciergeOfferRecord } from "@/types/admin";
import type { Database } from "@/types/database";

type ConciergeOfferRow = Database["public"]["Tables"]["concierge_offers"]["Row"];
type UnmatchedRequestRow = Database["public"]["Tables"]["unmatched_requests"]["Row"];

function parseGeographyPoint(point: unknown) {
  if (typeof point === "string") {
    const match = point.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);

    if (match) {
      return {
        longitude: Number(match[1]),
        latitude: Number(match[2]),
      };
    }
  }

  if (
    typeof point === "object" &&
    point !== null &&
    "coordinates" in point &&
    Array.isArray((point as { coordinates: unknown[] }).coordinates)
  ) {
    const coordinates = (point as { coordinates: unknown[] }).coordinates;
    return {
      longitude: typeof coordinates[0] === "number" ? coordinates[0] : 0,
      latitude: typeof coordinates[1] === "number" ? coordinates[1] : 0,
    };
  }

  return {
    longitude: 0,
    latitude: 0,
  };
}

function toConciergeOffer(
  row: ConciergeOfferRow,
  params?: { carrierBusinessName?: string | null },
): ConciergeOfferRecord {
  return {
    id: row.id,
    unmatchedRequestId: row.unmatched_request_id,
    customerId: row.customer_id,
    moveRequestId: row.move_request_id,
    listingId: row.listing_id,
    offerId: row.offer_id,
    bookingRequestId: row.booking_request_id,
    carrierId: row.carrier_id,
    carrierBusinessName: params?.carrierBusinessName ?? null,
    operatorTaskId: row.operator_task_id,
    status: row.status,
    quotedTotalPriceCents: row.quoted_total_price_cents,
    note: row.note,
    sentAt: row.sent_at,
    respondedAt: row.responded_at,
    cancelledReason: row.cancelled_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUnmatchedRequestForConcierge(unmatchedRequestId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("unmatched_requests")
    .select("*")
    .eq("id", unmatchedRequestId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "unmatched_request_lookup_failed");
  }

  return (data as UnmatchedRequestRow | null) ?? null;
}

function deriveMoveRequestExpiry() {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
}

function getConciergeBasePriceCents(params: {
  quotedTotalPriceCents: number;
  needsStairs: boolean;
  stairsExtraCents: number;
  needsHelper: boolean;
  helperExtraCents: number;
}) {
  let low = 100;
  let high = params.quotedTotalPriceCents;
  let best = params.quotedTotalPriceCents;

  for (let index = 0; index < 20; index += 1) {
    const mid = Math.floor((low + high) / 2);
    const breakdown = calculateBookingBreakdown({
      basePriceCents: mid,
      needsStairs: params.needsStairs,
      stairsExtraCents: params.stairsExtraCents,
      needsHelper: params.needsHelper,
      helperExtraCents: params.helperExtraCents,
    });

    if (breakdown.totalPriceCents >= params.quotedTotalPriceCents) {
      best = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return best;
}

async function ensureConciergeMoveRequest(params: {
  unmatchedRequest: UnmatchedRequestRow;
}) {
  if (params.unmatchedRequest.move_request_id) {
    return params.unmatchedRequest.move_request_id;
  }

  if (!params.unmatchedRequest.customer_id) {
    throw new AppError(
      "Guest route requests cannot be converted into on-platform concierge offers without a signed-in customer.",
      409,
      "concierge_offer_requires_customer",
    );
  }

  const supabase = createAdminClient();
  const pickupPoint = parseGeographyPoint(params.unmatchedRequest.pickup_point);
  const dropoffPoint = parseGeographyPoint(params.unmatchedRequest.dropoff_point);
  const { data, error } = await supabase
    .from("move_requests")
    .insert({
      customer_id: params.unmatchedRequest.customer_id,
      status: "matched",
      item_description: params.unmatchedRequest.item_description,
      item_category: params.unmatchedRequest.item_category ?? "other",
      item_photo_urls: [],
      pickup_address: params.unmatchedRequest.pickup_suburb,
      pickup_suburb: params.unmatchedRequest.pickup_suburb,
      pickup_postcode: params.unmatchedRequest.pickup_postcode ?? "0000",
      pickup_point: toGeographyPoint(pickupPoint.longitude, pickupPoint.latitude),
      dropoff_address: params.unmatchedRequest.dropoff_suburb,
      dropoff_suburb: params.unmatchedRequest.dropoff_suburb,
      dropoff_postcode: params.unmatchedRequest.dropoff_postcode ?? "0000",
      dropoff_point: toGeographyPoint(dropoffPoint.longitude, dropoffPoint.latitude),
      preferred_date: params.unmatchedRequest.preferred_date ?? null,
      needs_stairs: false,
      needs_helper: false,
      expires_at: deriveMoveRequestExpiry(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new AppError(error?.message ?? "Could not create a concierge move request.", 500, "concierge_move_request_create_failed");
  }

  await supabase
    .from("unmatched_requests")
    .update({ move_request_id: data.id })
    .eq("id", params.unmatchedRequest.id);

  return data.id;
}

async function createOfferForConciergeSend(params: {
  conciergeOffer: ConciergeOfferRow;
  unmatchedRequest: UnmatchedRequestRow;
}) {
  const supabase = createAdminClient();
  let listingQuery = supabase
    .from("capacity_listings")
    .select("id, carrier_id, price_cents, stairs_ok, stairs_extra_cents, helper_available, helper_extra_cents, trip_date, time_window")
    .eq("carrier_id", params.conciergeOffer.carrier_id)
    .in("status", ["active", "booked_partial"])
    .order("trip_date", { ascending: true })
    .limit(1);

  if (params.conciergeOffer.listing_id) {
    listingQuery = listingQuery.eq("id", params.conciergeOffer.listing_id);
  }

  const { data: listing, error: listingError } = await listingQuery.maybeSingle();

  if (listingError) {
    throw new AppError(listingError.message, 500, "concierge_listing_lookup_failed");
  }

  if (!listing) {
    throw new AppError(
      "The selected carrier does not have an active trip to attach this concierge offer to.",
      409,
      "concierge_listing_missing",
    );
  }

  const moveRequestId = await ensureConciergeMoveRequest({
    unmatchedRequest: params.unmatchedRequest,
  });

  const needsStairs = false;
  const needsHelper = false;
  const basePriceCents = getConciergeBasePriceCents({
    quotedTotalPriceCents: params.conciergeOffer.quoted_total_price_cents,
    needsStairs,
    stairsExtraCents: listing.stairs_extra_cents,
    needsHelper,
    helperExtraCents: listing.helper_extra_cents,
  });
  const pricing = calculateBookingBreakdown({
    basePriceCents,
    needsStairs,
    stairsExtraCents: listing.stairs_extra_cents,
    needsHelper,
    helperExtraCents: listing.helper_extra_cents,
  });

  const offer = await createOffer({
    move_request_id: moveRequestId,
    listing_id: listing.id,
    carrier_id: params.conciergeOffer.carrier_id,
    status: "active",
    match_class: "needs_approval",
    fit_confidence: "needs_approval",
    match_explanation:
      "Founder concierge matched this route to a carrier already running the corridor. Review the fit and send the normal booking request inside MoveMate.",
    ranking_score: 50,
    pickup_distance_km: null,
    dropoff_distance_km: null,
    detour_distance_km: null,
    base_price_cents: pricing.basePriceCents,
    stairs_fee_cents: pricing.stairsFeeCents,
    helper_fee_cents: pricing.helperFeeCents,
    booking_fee_cents: pricing.bookingFeeCents ?? 0,
    platform_fee_cents: pricing.platformFeeCents,
    gst_cents: pricing.gstCents,
    total_price_cents: params.conciergeOffer.quoted_total_price_cents,
  });

  return {
    moveRequestId,
    offer,
    listing,
  };
}

export async function listConciergeOffersForUnmatchedRequest(unmatchedRequestId: string) {
  if (!hasSupabaseAdminEnv()) {
    return [] as ConciergeOfferRecord[];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_offers")
    .select("*, carriers!inner(business_name)")
    .eq("unmatched_request_id", unmatchedRequestId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "concierge_offer_query_failed");
  }

  return (data ?? []).map((row) =>
    toConciergeOffer(row as ConciergeOfferRow, {
      carrierBusinessName:
        (row.carriers as { business_name?: string } | null)?.business_name ?? null,
    }),
  );
}

export async function listConciergeOffersForCustomer(userId: string) {
  if (!hasSupabaseAdminEnv()) {
    return [] as CustomerConciergeOffer[];
  }

  const customer = await getCustomerProfileForUser(userId);

  if (!customer) {
    return [] as CustomerConciergeOffer[];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_offers")
    .select("*, carriers!inner(business_name), capacity_listings(id, trip_date, time_window)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "concierge_offer_customer_query_failed");
  }

  return (data ?? []).map((row) =>
    toCustomerConciergeOffer({
      row: row as ConciergeOfferRow,
      carrierBusinessName:
        (row.carriers as { business_name?: string } | null)?.business_name ?? "Matching carrier",
      tripDate:
        (row.capacity_listings as { trip_date?: string } | null)?.trip_date ?? null,
      timeWindow:
        (row.capacity_listings as { time_window?: string } | null)?.time_window ?? null,
    }),
  );
}

export async function createConciergeOffer(params: {
  adminUserId: string;
  unmatchedRequestId: string;
  carrierId: string;
  listingId?: string | null;
  quotedTotalPriceCents: number;
  note?: string | null;
  operatorTaskId?: string | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const adminActorId = await getAdminActorId(params.adminUserId);
  const unmatchedRequest = await getUnmatchedRequestForConcierge(params.unmatchedRequestId);

  if (!unmatchedRequest) {
    throw new AppError("Route request not found.", 404, "unmatched_request_not_found");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_offers")
    .insert({
      unmatched_request_id: params.unmatchedRequestId,
      customer_id: unmatchedRequest.customer_id,
      carrier_id: params.carrierId,
      listing_id: params.listingId ?? null,
      created_by_admin_user_id: adminActorId,
      operator_task_id: params.operatorTaskId ?? null,
      quoted_total_price_cents: params.quotedTotalPriceCents,
      note: params.note?.trim() || null,
      status: "draft",
    })
    .select("*, carriers!inner(business_name)")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "concierge_offer_create_failed");
  }

  await recordAdminActionEvent({
    adminUserId: params.adminUserId,
    entityType: "concierge_offer",
    entityId: data.id,
    actionType: "concierge_offer_created",
    reason: params.note?.trim() || null,
    metadata: {
      unmatchedRequestId: params.unmatchedRequestId,
      carrierId: params.carrierId,
      listingId: params.listingId ?? null,
      quotedTotalPriceCents: params.quotedTotalPriceCents,
      operatorTaskId: params.operatorTaskId ?? null,
    },
  });

  return toConciergeOffer(data as ConciergeOfferRow, {
    carrierBusinessName:
      (data.carriers as { business_name?: string } | null)?.business_name ?? null,
  });
}

export async function sendConciergeOffer(params: {
  adminUserId: string;
  conciergeOfferId: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data: conciergeOffer, error } = await supabase
    .from("concierge_offers")
    .select("*")
    .eq("id", params.conciergeOfferId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "concierge_offer_lookup_failed");
  }

  if (!conciergeOffer) {
    throw new AppError("Concierge offer not found.", 404, "concierge_offer_not_found");
  }

  if (!["draft", "declined"].includes(conciergeOffer.status)) {
    throw new AppError("Only draft concierge offers can be sent.", 409, "concierge_offer_not_sendable");
  }

  const unmatchedRequest = await getUnmatchedRequestForConcierge(conciergeOffer.unmatched_request_id);

  if (!unmatchedRequest) {
    throw new AppError("Route request not found.", 404, "unmatched_request_not_found");
  }

  const { moveRequestId, offer, listing } = await createOfferForConciergeSend({
    conciergeOffer: conciergeOffer as ConciergeOfferRow,
    unmatchedRequest,
  });

  const { data: updated, error: updateError } = await supabase
    .from("concierge_offers")
    .update({
      customer_id: unmatchedRequest.customer_id,
      move_request_id: moveRequestId,
      listing_id: listing.id,
      offer_id: offer.id,
      status: "sent",
      sent_at: new Date().toISOString(),
      responded_at: null,
      cancelled_reason: null,
    })
    .eq("id", conciergeOffer.id)
    .select("*, carriers!inner(business_name)")
    .single();

  if (updateError) {
    throw new AppError(updateError.message, 500, "concierge_offer_send_failed");
  }

  await recordAdminActionEvent({
    adminUserId: params.adminUserId,
    entityType: "concierge_offer",
    entityId: conciergeOffer.id,
    actionType: "concierge_offer_sent",
    reason: conciergeOffer.note,
    metadata: {
      unmatchedRequestId: conciergeOffer.unmatched_request_id,
      moveRequestId,
      offerId: offer.id,
      listingId: listing.id,
    },
  });

  if (unmatchedRequest.notify_email) {
    await sendAlertLifecycleEmail({
      to: unmatchedRequest.notify_email,
      subject: `Founder match available: ${unmatchedRequest.pickup_suburb} to ${unmatchedRequest.dropoff_suburb}`,
      title: "A founder-sourced match is ready to review",
      intro:
        "MoveMate found a manual corridor match for this move need. If it still fits, send it into the normal booking-request flow from inside the product.",
      routeLabel: `${unmatchedRequest.pickup_suburb} to ${unmatchedRequest.dropoff_suburb}`,
      ctaPath: "/alerts",
      ctaLabel: "Open alerts",
      bodyLines: [
        "This does not bypass MoveMate. You still review the route and send the normal request inside the marketplace flow.",
      ],
    });
  }

  return toConciergeOffer(updated as ConciergeOfferRow, {
    carrierBusinessName:
      (updated.carriers as { business_name?: string } | null)?.business_name ?? null,
  });
}

export async function cancelConciergeOffer(params: {
  adminUserId: string;
  conciergeOfferId: string;
  reason?: string | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_offers")
    .update({
      status: "cancelled",
      cancelled_reason: params.reason?.trim() || null,
      responded_at: new Date().toISOString(),
    })
    .eq("id", params.conciergeOfferId)
    .select("*, carriers!inner(business_name)")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "concierge_offer_cancel_failed");
  }

  await recordAdminActionEvent({
    adminUserId: params.adminUserId,
    entityType: "concierge_offer",
    entityId: params.conciergeOfferId,
    actionType: "concierge_offer_cancelled",
    reason: params.reason?.trim() || null,
  });

  return toConciergeOffer(data as ConciergeOfferRow, {
    carrierBusinessName:
      (data.carriers as { business_name?: string } | null)?.business_name ?? null,
  });
}

export async function respondToConciergeOffer(params: {
  userId: string;
  conciergeOfferId: string;
  action: "accept" | "decline";
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const customer = await getCustomerProfileForUser(params.userId);

  if (!customer) {
    throw new AppError("Customer profile not found.", 404, "customer_not_found");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_offers")
    .select("*")
    .eq("id", params.conciergeOfferId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "concierge_offer_lookup_failed");
  }

  if (!data) {
    throw new AppError("Concierge offer not found.", 404, "concierge_offer_not_found");
  }

  if (data.status !== "sent") {
    throw new AppError("This concierge offer is no longer waiting on a customer response.", 409, "concierge_offer_not_open");
  }

  if (params.action === "decline") {
    const { data: declined, error: declineError } = await supabase
      .from("concierge_offers")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("*")
      .single();

    if (declineError) {
      throw new AppError(declineError.message, 500, "concierge_offer_decline_failed");
    }

    await recordAdminActionEvent({
      actorRole: "system",
      entityType: "concierge_offer",
      entityId: data.id,
      actionType: "concierge_offer_declined_by_customer",
      metadata: {
        customerId: customer.id,
      },
    });

    return {
      conciergeOffer: toCustomerConciergeOffer({
        row: declined as ConciergeOfferRow,
      }),
      bookingRequest: null,
    };
  }

  if (!data.move_request_id || !data.offer_id) {
    throw new AppError(
      "This concierge offer is missing its request-flow links. Ask ops to resend it.",
      409,
      "concierge_offer_not_ready",
    );
  }

  const result = await createRequestToBook(params.userId, {
    moveRequestId: data.move_request_id,
    offerId: data.offer_id,
    responseHours: 12,
  });

  const { data: accepted, error: acceptError } = await supabase
    .from("concierge_offers")
    .update({
      status: "accepted",
      booking_request_id: result.bookingRequest.id,
      responded_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .select("*, carriers!inner(business_name), capacity_listings(id, trip_date, time_window)")
    .single();

  if (acceptError) {
    throw new AppError(acceptError.message, 500, "concierge_offer_accept_failed");
  }

  await recordAdminActionEvent({
    actorRole: "system",
    entityType: "concierge_offer",
    entityId: data.id,
    actionType: "concierge_offer_accepted_by_customer",
    metadata: {
      customerId: customer.id,
      bookingRequestId: result.bookingRequest.id,
    },
  });

  return {
    conciergeOffer: toCustomerConciergeOffer({
      row: accepted as ConciergeOfferRow,
      carrierBusinessName:
        (accepted.carriers as { business_name?: string } | null)?.business_name ?? "Matching carrier",
      tripDate:
        (accepted.capacity_listings as { trip_date?: string } | null)?.trip_date ?? null,
      timeWindow:
        (accepted.capacity_listings as { time_window?: string } | null)?.time_window ?? null,
    }),
    bookingRequest: result.bookingRequest,
  };
}

export async function getConciergeOfferByIdForAdmin(conciergeOfferId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("concierge_offers")
    .select("*")
    .eq("id", conciergeOfferId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "concierge_offer_lookup_failed");
  }

  return (data as ConciergeOfferRow | null) ?? null;
}

export async function getOfferForConciergeOffer(conciergeOfferId: string) {
  const conciergeOffer = await getConciergeOfferByIdForAdmin(conciergeOfferId);

  if (!conciergeOffer?.offer_id) {
    return null;
  }

  return getOfferByIdForAdmin(conciergeOffer.offer_id);
}
