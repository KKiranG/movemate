import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toOffer } from "@/lib/data/mappers";
import { searchTrips } from "@/lib/data/trips";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import type { Database } from "@/types/database";
import type { MoveRequest, Offer, OfferFitConfidence, OfferMatchClass } from "@/types/move-request";
import type { TripSearchResult } from "@/types/trip";

type OfferRow = Database["public"]["Tables"]["offers"]["Row"];

export async function createOffer(params: Database["public"]["Tables"]["offers"]["Insert"]) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("offers")
    .insert(params)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "offer_create_failed");
  }

  return toOffer(data as OfferRow);
}

export async function listOffersForMoveRequest(moveRequestId: string) {
  if (!hasSupabaseEnv()) {
    return [] as Offer[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("move_request_id", moveRequestId)
    .order("ranking_score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "offer_query_failed");
  }

  return (data ?? []).map((row) => toOffer(row as OfferRow));
}

export async function getOfferByIdForMoveRequest(moveRequestId: string, offerId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .eq("move_request_id", moveRequestId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "offer_lookup_failed");
  }

  return data ? toOffer(data as OfferRow) : null;
}

export async function getOfferByIdForAdmin(offerId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "offer_lookup_failed");
  }

  return data ? toOffer(data as OfferRow) : null;
}

// Actor-scoped offer read for customer and carrier flows.
// RLS policies offers_customer_select_own and offers_carrier_select_own
// grant access without admin client.
export async function getOfferById(offerId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "offer_lookup_failed");
  }

  return data ? toOffer(data as OfferRow) : null;
}

export async function getOfferByListingForMoveRequest(moveRequestId: string, listingId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("move_request_id", moveRequestId)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "offer_lookup_failed");
  }

  return data ? toOffer(data as OfferRow) : null;
}

function getDerivedOfferPricing(moveRequest: MoveRequest, trip: TripSearchResult) {
  const basePriceCents = trip.priceCents;
  return calculateBookingBreakdown({
    basePriceCents,
    minimumBasePriceCents: trip.minimumBasePriceCents,
    carrierHandlingPolicy: trip.rules.handlingPolicy,
    customerMoverPreference: moveRequest.customerMoverPreference,
    stairsLevelPickup: moveRequest.stairsLevelPickup,
    stairsLevelDropoff: moveRequest.stairsLevelDropoff,
    liftAvailablePickup: moveRequest.liftAvailablePickup,
    liftAvailableDropoff: moveRequest.liftAvailableDropoff,
    stairsLowCents: trip.rules.stairsLowCents,
    stairsMediumCents: trip.rules.stairsMediumCents,
    stairsHighCents: trip.rules.stairsHighCents,
    secondMoverExtraCents: trip.rules.secondMoverExtraCents,
    needsStairs: moveRequest.needsStairs && trip.rules.stairsOk,
    stairsExtraCents: trip.rules.stairsExtraCents,
    needsHelper: moveRequest.needsHelper && trip.rules.helperAvailable,
    helperExtraCents: trip.rules.helperExtraCents,
  });
}

function getDerivedMatchClass(moveRequest: MoveRequest, trip: TripSearchResult): OfferMatchClass {
  const pickupDistanceKm = trip.breakdown.pickupDistanceKm ?? trip.detourRadiusKm;
  const dropoffDistanceKm = trip.breakdown.dropoffDistanceKm ?? trip.detourRadiusKm;
  const preferredDate = moveRequest.route.preferredDate;

  if (preferredDate && trip.tripDate !== preferredDate) {
    return "nearby_date";
  }

  if (pickupDistanceKm <= 2 && dropoffDistanceKm <= 2) {
    return "direct";
  }

  if (pickupDistanceKm > dropoffDistanceKm) {
    return "near_pickup";
  }

  if (dropoffDistanceKm > pickupDistanceKm) {
    return "near_dropoff";
  }

  return "partial_route";
}

function getDerivedFitConfidence(trip: TripSearchResult): OfferFitConfidence {
  if (trip.matchScore >= 70) {
    return "likely_fits";
  }

  if (trip.matchScore >= 45) {
    return "review_photos";
  }

  return "needs_approval";
}

function buildDerivedMatchExplanation(moveRequest: MoveRequest, trip: TripSearchResult) {
  const routeSummary = `${trip.route.originSuburb} to ${trip.route.destinationSuburb}`;

  const moverNote =
    moveRequest.customerMoverPreference === "two_movers" &&
    trip.rules.handlingPolicy === "two_movers"
      ? " Two movers available."
      : moveRequest.customerMoverPreference === "two_movers" &&
          trip.rules.handlingPolicy !== "two_movers"
        ? " Two movers may need confirmation."
        : moveRequest.customerMoverPreference === "customer_help" &&
            trip.rules.handlingPolicy === "solo_customer_help"
          ? " Customer help accepted."
          : "";

  const stairsNote =
    (moveRequest.stairsLevelPickup !== "none" || moveRequest.stairsLevelDropoff !== "none") &&
    !trip.rules.stairsOk
      ? " Stairs need manual confirmation."
      : (moveRequest.stairsLevelPickup !== "none" || moveRequest.stairsLevelDropoff !== "none") &&
          trip.rules.stairsOk
        ? " Carrier accepts stairs."
        : "";

  return `Already heading ${routeSummary}.${moverNote}${stairsNote}`.trim();
}

export async function deriveOffersForMoveRequest(moveRequest: MoveRequest) {
  const searchResponse = await searchTrips({
    from: moveRequest.route.pickupSuburb,
    to: moveRequest.route.dropoffSuburb,
    when: moveRequest.route.preferredDate ?? undefined,
    what: moveRequest.item.category,
    includeNearbyDates: true,
  });

  return searchResponse.results.map((trip, index) => ({
    id: `derived-offer-${moveRequest.id}-${trip.id}`,
    moveRequestId: moveRequest.id,
    listingId: trip.id,
    carrierId: trip.carrier.id,
    status: "active" as const,
    matchClass: getDerivedMatchClass(moveRequest, trip),
    fitConfidence: getDerivedFitConfidence(trip),
    matchExplanation: buildDerivedMatchExplanation(moveRequest, trip),
    rankingScore: Number((trip.matchScore - index * 0.01).toFixed(2)),
    pickupDistanceKm: trip.breakdown.pickupDistanceKm ?? null,
    dropoffDistanceKm: trip.breakdown.dropoffDistanceKm ?? null,
    detourDistanceKm:
      trip.breakdown.pickupDistanceKm !== undefined &&
      trip.breakdown.dropoffDistanceKm !== undefined
        ? Number((trip.breakdown.pickupDistanceKm + trip.breakdown.dropoffDistanceKm).toFixed(1))
        : null,
    pricing: getDerivedOfferPricing(moveRequest, trip),
    expiresAt: null,
    createdAt: new Date().toISOString(),
  }) satisfies Offer);
}

export async function ensureOfferForMoveRequestSelection(params: {
  moveRequest: MoveRequest;
  offerId?: string;
  listingId?: string;
}) {
  if (params.offerId) {
    const existingOffer = await getOfferByIdForMoveRequest(params.moveRequest.id, params.offerId);

    if (existingOffer) {
      return existingOffer;
    }
  }

  if (!params.listingId) {
    throw new AppError("Offer not found for this move request.", 404, "offer_not_found");
  }

  const persistedOffer = await getOfferByListingForMoveRequest(
    params.moveRequest.id,
    params.listingId,
  );

  if (persistedOffer) {
    return persistedOffer;
  }

  const derivedOffers = await deriveOffersForMoveRequest(params.moveRequest);
  const derivedOffer = derivedOffers.find((offer) => offer.listingId === params.listingId);

  if (!derivedOffer) {
    throw new AppError("That listing is not available for this move request.", 404, "offer_not_found");
  }

  return createOffer({
    move_request_id: params.moveRequest.id,
    listing_id: derivedOffer.listingId,
    carrier_id: derivedOffer.carrierId,
    status: "active",
    match_class: derivedOffer.matchClass,
    fit_confidence: derivedOffer.fitConfidence,
    match_explanation: derivedOffer.matchExplanation,
    ranking_score: derivedOffer.rankingScore,
    pickup_distance_km: derivedOffer.pickupDistanceKm ?? null,
    dropoff_distance_km: derivedOffer.dropoffDistanceKm ?? null,
    detour_distance_km: derivedOffer.detourDistanceKm ?? null,
    base_price_cents: derivedOffer.pricing.basePriceCents,
    stairs_fee_cents: derivedOffer.pricing.stairsFeeCents,
    helper_fee_cents: derivedOffer.pricing.helperFeeCents,
    booking_fee_cents: derivedOffer.pricing.bookingFeeCents,
    platform_fee_cents: derivedOffer.pricing.platformFeeCents,
    gst_cents: derivedOffer.pricing.gstCents,
    total_price_cents: derivedOffer.pricing.totalPriceCents,
    expires_at: derivedOffer.expiresAt ?? null,
  });
}

export async function updateOfferStatus(offerId: string, status: Offer["status"]) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("offers")
    .update({ status })
    .eq("id", offerId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "offer_update_failed");
  }

  return toOffer(data as OfferRow);
}
