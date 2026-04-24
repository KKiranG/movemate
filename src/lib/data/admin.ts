import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { buildBookingEmail } from "@/lib/email";
import { AppError } from "@/lib/errors";
import { sendBookingTransactionalEmail } from "@/lib/notifications";
import { captureAppError } from "@/lib/sentry";
import { reverseBookingPayment } from "@/lib/stripe/payment-actions";
import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { listConciergeOffersForUnmatchedRequest } from "@/lib/data/concierge-offers";
import { listOperatorTasks, recordAdminActionEvent } from "@/lib/data/operator-tasks";
import { ensureUnmatchedRequestSlaTasks } from "@/lib/data/unmatched-requests";
import { sanitizeText } from "@/lib/utils";
import { getTripPublishReadiness } from "@/lib/validation/trip";
import type { ConciergeOfferRecord, MatchedAlertNotificationRecord, OperatorTask, ValidationMetric } from "@/types/admin";
import type { Database } from "@/types/database";

type AdminActionEventRow = Database["public"]["Tables"]["admin_action_events"]["Row"];

export async function getCorridorDemandSnapshot(params: {
  pickupSuburb: string;
  dropoffSuburb: string;
  recentSinceIso: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const [{ count: openAlertCount, error: openAlertError }, { count: recentDemandCount, error: recentDemandError }] =
    await Promise.all([
      supabase
        .from("unmatched_requests")
        .select("id", { count: "exact", head: true })
        .eq("pickup_suburb", params.pickupSuburb)
        .eq("dropoff_suburb", params.dropoffSuburb)
        .in("status", ["active", "notified"]),
      supabase
        .from("unmatched_requests")
        .select("id", { count: "exact", head: true })
        .eq("pickup_suburb", params.pickupSuburb)
        .eq("dropoff_suburb", params.dropoffSuburb)
        .gte("created_at", params.recentSinceIso),
    ]);

  if (openAlertError) {
    throw new AppError(openAlertError.message, 500, "corridor_open_alert_count_failed");
  }

  if (recentDemandError) {
    throw new AppError(recentDemandError.message, 500, "corridor_recent_demand_count_failed");
  }

  return {
    openAlertCount: openAlertCount ?? 0,
    recentDemandCount: recentDemandCount ?? 0,
  };
}

export async function listAdminDisputes() {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*, booking:bookings(id,booking_reference,total_price_cents,status,payment_status,pickup_proof_photo_url,delivery_proof_photo_url,delivered_at,customer_confirmed_at), events:booking_events!booking_events_booking_id_fkey(event_type,created_at,metadata)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "admin_dispute_query_failed");
  }

  return data ?? [];
}

export async function getAdminDisputeById(disputeId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*, booking:bookings(id,booking_reference,total_price_cents,status,payment_status,pickup_proof_photo_url,delivery_proof_photo_url,delivered_at,customer_confirmed_at), events:booking_events!booking_events_booking_id_fkey(event_type,created_at,metadata)")
    .eq("id", disputeId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "admin_dispute_lookup_failed");
  }

  return data;
}

export async function resolveDispute(params: {
  disputeId: string;
  resolutionNotes: string;
  resolvedBy: string;
  status: "investigating" | "resolved" | "closed";
  bookingStatus?: "completed" | "cancelled";
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const sanitizedResolutionNotes = sanitizeText(params.resolutionNotes);

  if (sanitizedResolutionNotes.length < 20) {
    throw new AppError(
      "Resolution notes must be at least 20 characters.",
      400,
      "resolution_notes_too_short",
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("disputes")
    .update({
      status: params.status,
      resolution_notes: sanitizedResolutionNotes,
      resolved_by: params.status === "resolved" || params.status === "closed" ? params.resolvedBy : null,
      assigned_admin_user_id: params.resolvedBy,
      resolved_at:
        params.status === "resolved" || params.status === "closed"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", params.disputeId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "dispute_resolve_failed");
  }

  await supabase.from("booking_events").insert({
    booking_id: data.booking_id,
    actor_role: "admin",
    actor_user_id: params.resolvedBy,
    event_type: "dispute_resolution_updated",
    metadata: {
      status: params.status,
      bookingStatus: params.bookingStatus ?? null,
      reason: sanitizedResolutionNotes,
    },
  });

  await recordAdminActionEvent({
    adminUserId: params.resolvedBy,
    entityType: "dispute",
    entityId: params.disputeId,
    actionType: `dispute_${params.status}`,
    reason: sanitizedResolutionNotes,
    metadata: {
      bookingId: data.booking_id,
      bookingStatus: params.bookingStatus ?? null,
    },
  });

  let bookingPaymentStatus:
    | "pending"
    | "authorized"
    | "captured"
    | "capture_failed"
    | "refunded"
    | "failed"
    | "authorization_cancelled"
    | null =
    null;
  let stripePaymentIntentId: string | null = null;

  if (params.bookingStatus) {
    const booking = await updateBookingStatusForActor({
      userId: params.resolvedBy,
      bookingId: data.booking_id,
      nextStatus: params.bookingStatus,
      actorRole: "admin",
      adminReason: sanitizedResolutionNotes,
      cancellationReason:
        params.bookingStatus === "cancelled"
          ? "Cancelled during dispute resolution"
          : undefined,
    });

    bookingPaymentStatus = booking.paymentStatus ?? null;
    stripePaymentIntentId = booking.stripePaymentIntentId ?? null;

    // When resolving a dispute as cancelled, trigger the shared payment reversal path.
    if (params.bookingStatus === "cancelled" && process.env.STRIPE_SECRET_KEY) {
      if (stripePaymentIntentId) {
        try {
          await reverseBookingPayment({
            supabase,
            bookingId: data.booking_id,
            paymentIntentId: stripePaymentIntentId,
            paymentStatus: bookingPaymentStatus,
            feature: "admin",
            action: "dispute_cancellation_payment_reversal",
          });
        } catch (stripeError) {
          captureAppError(stripeError, {
            feature: "admin",
            action: "dispute_refund",
            tags: { bookingId: data.booking_id, disputeId: params.disputeId },
          });
        }
      }
    }
  }

  const { data: bookingParties } = await supabase
    .from("bookings")
    .select("booking_reference, customer:customers(email), carrier:carriers(email)")
    .eq("id", data.booking_id)
    .single();

  const customerEmail = (bookingParties?.customer as { email?: string } | null)?.email;
  const carrierEmail = (bookingParties?.carrier as { email?: string } | null)?.email;

  await Promise.all(
    [customerEmail, carrierEmail]
      .filter((email): email is string => Boolean(email))
      .map((email) =>
        sendBookingTransactionalEmail({
          bookingId: data.booking_id,
          bookingStatus: params.bookingStatus ?? null,
          emailType: "dispute_resolution_update",
          to: email,
          subject: `Booking dispute updated: ${bookingParties?.booking_reference ?? data.booking_id}`,
          html: buildBookingEmail({
            eyebrow: "Dispute update",
            title: `Dispute status: ${params.status}`,
            intro: "The dispute status changed in MoveMate and the latest ops note is below.",
            bookingReference: bookingParties?.booking_reference ?? data.booking_id,
            routeLabel: "Open the booking detail for the current proof and status record.",
            ctaPath: `/bookings/${data.booking_id}`,
            ctaLabel: "Open booking detail",
            bodyLines: [sanitizedResolutionNotes],
          }),
        }),
      ),
  );

  return data;
}

export async function getValidationMetrics(): Promise<ValidationMetric[]> {
  if (!hasSupabaseAdminEnv()) {
    return [] as ValidationMetric[];
  }

  const supabase = createAdminClient();
  const [listings, bookings, events, carriers, disputes] = await Promise.all([
    supabase
      .from("capacity_listings")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "booked_partial"]),
    supabase
      .from("bookings")
      .select("id, status, total_price_cents", { count: "exact" }),
    supabase
      .from("analytics_events")
      .select("id, event_name"),
    supabase
      .from("carriers")
      .select("id, total_bookings_completed"),
    supabase
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const completedBookings =
    bookings.data?.filter((booking) => booking.status === "completed").length ?? 0;
  const searchStarts =
    events.data?.filter((event) => event.event_name === "search_submitted").length ?? 0;
  const bookingStarts =
    events.data?.filter((event) => event.event_name === "booking_started").length ?? 0;
  const repeatCarriers =
    carriers.data?.filter((carrier) => carrier.total_bookings_completed > 1).length ?? 0;
  const openDisputes = disputes.count ?? 0;
  const totalCompletedValueCents = bookings.data
    ?.filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => sum + Number(booking.total_price_cents ?? 0), 0) ?? 0;
  const fillRatePct = Math.round((completedBookings / 50) * 100);
  const avgJobValueCents =
    completedBookings > 0 ? Math.round(totalCompletedValueCents / completedBookings) : 0;
  const disputeRatePct =
    completedBookings > 0 ? Math.round((openDisputes / completedBookings) * 100) : 0;

  return [
    {
      label: "Active listings",
      value: listings.count ?? 0,
      kind: "number",
    },
    {
      label: "Search-to-booking conversion",
      value: searchStarts > 0 ? Math.round((bookingStarts / searchStarts) * 100) : 0,
      kind: "percentage",
    },
    {
      label: "Completed bookings",
      value: completedBookings,
      kind: "number",
    },
    {
      label: "Carrier reuse",
      value: repeatCarriers,
      kind: "number",
    },
    {
      label: "Open disputes",
      value: openDisputes,
      kind: "number",
    },
    {
      label: "Fill rate target",
      value: fillRatePct,
      kind: "percentage",
      helperText: `${completedBookings} completed / 50 goal`,
    },
    {
      label: "Avg job value",
      value: avgJobValueCents,
      kind: "currency",
    },
    {
      label: "Dispute rate",
      value: disputeRatePct,
      kind: "percentage",
    },
  ];
}

export async function getAdminDashboardData() {
  if (!hasSupabaseAdminEnv()) {
    return {
      metrics: [] as ValidationMetric[],
      lastUpdatedAt: null as string | null,
    };
  }

  const supabase = createAdminClient();
  const [{ data: latestEvent }, metrics] = await Promise.all([
    supabase
      .from("booking_events")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getValidationMetrics(),
  ]);

  return {
    metrics,
    lastUpdatedAt: latestEvent?.created_at ?? new Date().toISOString(),
  };
}

function getListingAccepts(listing: {
  accepts_furniture: boolean;
  accepts_boxes: boolean;
  accepts_appliances: boolean;
  accepts_fragile: boolean;
}) {
  return [
    ...(listing.accepts_furniture ? (["furniture"] as const) : []),
    ...(listing.accepts_boxes ? (["boxes"] as const) : []),
    ...(listing.accepts_appliances ? (["appliance"] as const) : []),
    ...(listing.accepts_fragile ? (["fragile"] as const) : []),
  ];
}

export async function getFounderOpsCockpitData() {
  if (!hasSupabaseAdminEnv()) {
    return {
      headlineCounts: {
        verification: 0,
        weakListings: 0,
        payoutBlockers: 0,
        riskyBookings: 0,
      },
      sections: [] as Array<{
        key: string;
        title: string;
        description: string;
        href?: string;
        count: number;
        items: Array<{
          title: string;
          detail: string;
          href?: string;
        }>;
      }>,
    };
  }

  const supabase = createAdminClient();
  const stalePendingCutoff = new Date(Date.now() - 90 * 60 * 1000).toISOString();
  const staleDeliveredCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: carriers }, { data: listings }, { data: bookings }, { data: disputes }] =
    await Promise.all([
      supabase
        .from("carriers")
        .select("id, business_name, verification_status, verification_submitted_at")
        .in("verification_status", ["pending", "submitted"])
        .order("verification_submitted_at", { ascending: true }),
      supabase
        .from("capacity_listings")
        .select(
          "id, trip_date, time_window, origin_suburb, destination_suburb, space_size, available_volume_m3, available_weight_kg, remaining_capacity_pct, special_notes, helper_available, stairs_ok, accepts_furniture, accepts_boxes, accepts_appliances, accepts_fragile, status",
        )
        .in("status", ["active", "booked_partial"]),
      supabase
        .from("bookings")
        .select(
          "id, booking_reference, status, payment_status, carrier_payout_cents, pending_expires_at, created_at, delivered_at, customer_confirmed_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("disputes")
        .select("id, booking_id, category, status, created_at")
        .in("status", ["open", "investigating"])
        .order("created_at", { ascending: false }),
    ]);

  const verificationItems = (carriers ?? []).slice(0, 5).map((carrier) => ({
    title: carrier.business_name,
    detail: carrier.verification_submitted_at
      ? `Submitted ${new Date(carrier.verification_submitted_at).toLocaleString("en-AU")}`
      : "Submission time missing",
    href: "/admin/verification",
  }));

  const weakListings = (listings ?? [])
    .map((listing) => {
      const issues = getTripPublishReadiness({
        status: "active",
        spaceSize: listing.space_size,
        availableVolumeM3: Number(listing.available_volume_m3 ?? 0),
        availableWeightKg: Number(listing.available_weight_kg ?? 0),
        accepts: getListingAccepts(listing),
        timeWindow: listing.time_window,
        specialNotes: listing.special_notes,
        helperAvailable: listing.helper_available,
        stairsOk: listing.stairs_ok,
      });

      if (issues.length === 0) {
        return null;
      }

      return {
        title: `${listing.origin_suburb} → ${listing.destination_suburb}`,
        detail: issues[0]?.message ?? "Listing needs a quality pass.",
      };
    })
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing));

  const payoutBlockers = (bookings ?? [])
    .filter(
      (booking) =>
        (booking.status === "delivered" ||
          booking.status === "completed" ||
          booking.payment_status === "capture_failed") &&
        booking.payment_status !== "captured" &&
        booking.payment_status !== "refunded" &&
        booking.payment_status !== "authorization_cancelled",
    )
    .map((booking) => ({
      title: booking.booking_reference,
      detail:
        booking.payment_status === "capture_failed"
          ? "Capture failed after completion."
          : booking.status === "delivered"
            ? "Waiting on customer confirmation before release."
            : "Completed, but capture has not cleared yet.",
      href: `/admin/bookings?q=${booking.booking_reference}`,
    }));

  const riskyBookings = (bookings ?? [])
    .flatMap((booking) => {
      if (booking.status === "pending" && booking.created_at <= stalePendingCutoff) {
        return [
          {
            title: booking.booking_reference,
            detail: "Pending longer than 90 minutes.",
            href: `/admin/bookings?q=${booking.booking_reference}`,
          },
        ];
      }

      if (
        booking.status === "delivered" &&
        !booking.customer_confirmed_at &&
        booking.delivered_at &&
        booking.delivered_at <= staleDeliveredCutoff
      ) {
        return [
          {
            title: booking.booking_reference,
            detail: "Delivered more than 24 hours ago without receipt confirmation.",
            href: `/admin/bookings?q=${booking.booking_reference}`,
          },
        ];
      }

      if (booking.payment_status === "capture_failed") {
        return [
          {
            title: booking.booking_reference,
            detail: "Payment capture failed and needs ops review.",
            href: `/admin/payments`,
          },
        ];
      }

      return [];
    })
    .concat(
      (disputes ?? []).slice(0, 5).map((dispute) => ({
        title: `Dispute ${dispute.category}`,
        detail: `Booking ${dispute.booking_id} is ${dispute.status}.`,
        href: `/admin/disputes`,
      })),
    );

  return {
    headlineCounts: {
      verification: carriers?.length ?? 0,
      weakListings: weakListings.length,
      payoutBlockers: payoutBlockers.length,
      riskyBookings: riskyBookings.length,
    },
    sections: [
      {
        key: "verification",
        title: "Verification queue",
        description: "Who still needs a human trust decision.",
        href: "/admin/verification",
        count: carriers?.length ?? 0,
        items: verificationItems,
      },
      {
        key: "weak-listings",
        title: "Weak live listings",
        description: "Routes that are live but still read as low-confidence match supply.",
        count: weakListings.length,
        items: weakListings.slice(0, 5),
      },
      {
        key: "payout-blockers",
        title: "Payout blockers",
        description: "Completed or delivered bookings that still have release friction.",
        href: "/admin/payments",
        count: payoutBlockers.length,
        items: payoutBlockers.slice(0, 5),
      },
      {
        key: "risky-bookings",
        title: "Risky bookings",
        description: "Pending, disputed, or stale completion states that need intervention.",
        href: "/admin/bookings",
        count: riskyBookings.length,
        items: riskyBookings.slice(0, 5),
      },
    ],
  };
}

export async function listAdminAlertQueueData() {
  if (!hasSupabaseAdminEnv()) {
    return {
      sections: [] as Array<{
        key: "active" | "notified" | "matched" | "expired";
        title: string;
        items: Array<{
          id: string;
          routeLabel: string;
          itemLabel: string;
          notifyEmail: string | null;
          createdAt: string;
          matchedAt: string | null;
          moveRequestId: string | null;
          carrierSuggestions: Array<{
            listingId: string;
            carrierId: string;
            businessName: string;
            tripDate: string;
            timeWindow: string;
            basePriceCents: number;
          }>;
          conciergeOffers: ConciergeOfferRecord[];
        }>;
      }>,
      operatorTasks: [] as OperatorTask[],
      notificationLogs: [] as MatchedAlertNotificationRecord[],
      staleTrips: [] as Array<{
        listingId: string;
        routeLabel: string;
        tripDate: string;
        blocker: string;
        bookingCount: number;
        freshnessMissCount: number;
        suspensionReason: string | null;
        lastActionAt: string | null;
        lastActionLabel: string | null;
        status: "watch" | "suspended";
      }>,
    };
  }

  await ensureUnmatchedRequestSlaTasks();

  const supabase = createAdminClient();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [{ data: unmatchedRequests }, operatorTasks, { data: notificationRows }, { data: staleListingRows }] =
    await Promise.all([
      supabase
        .from("unmatched_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      listOperatorTasks({ status: "open", limit: 50 }),
      supabase
        .from("matched_alert_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("capacity_listings")
        .select("id, carrier_id, origin_suburb, destination_suburb, trip_date, status, checkin_24h_requested_at, checkin_24h_confirmed, checkin_2h_requested_at, checkin_2h_confirmed, freshness_suspended_at, freshness_miss_count, freshness_suspension_reason")
        .in("status", ["active", "booked_partial", "suspended"])
        .lte("trip_date", tomorrow)
        .order("trip_date", { ascending: true })
        .limit(30),
    ]);

  const staleListings = (staleListingRows ?? []).filter((listing) => {
    if (listing.status === "suspended") {
      return true;
    }

    return (
      (listing.checkin_24h_requested_at && !listing.checkin_24h_confirmed) ||
      (listing.checkin_2h_requested_at && !listing.checkin_2h_confirmed)
    );
  });
  const staleListingIds = staleListings.map((listing) => listing.id);
  const [{ data: impactedBookingRows }, { data: listingActionRows }] = staleListingIds.length
    ? await Promise.all([
        supabase
          .from("bookings")
          .select("id, listing_id, booking_reference, status")
          .in("listing_id", staleListingIds)
          .in("status", ["pending", "confirmed", "picked_up", "in_transit", "delivered"]),
        supabase
          .from("admin_action_events")
          .select("*")
          .eq("entity_type", "listing")
          .in("entity_id", staleListingIds)
          .order("created_at", { ascending: false })
          .limit(100),
      ])
    : [{ data: [] }, { data: [] }];
  const impactedBookingCountByListing = (impactedBookingRows ?? []).reduce(
    (map, booking) => {
      map.set(booking.listing_id, (map.get(booking.listing_id) ?? 0) + 1);
      return map;
    },
    new Map<string, number>(),
  );
  const listingActionsById = (listingActionRows ?? []).reduce(
    (map, row) => {
      if (!map.has(row.entity_id)) {
        map.set(row.entity_id, row);
      }
      return map;
    },
    new Map<string, AdminActionEventRow>(),
  );

  const items = await Promise.all(
    (unmatchedRequests ?? []).map(async (row) => {
      const [{ data: carrierSuggestions }, conciergeOffers] = await Promise.all([
        supabase
          .from("capacity_listings")
          .select("id, carrier_id, trip_date, time_window, price_cents, carriers!inner(business_name)")
          .eq("origin_suburb", row.pickup_suburb)
          .eq("destination_suburb", row.dropoff_suburb)
          .in("status", ["active", "booked_partial"])
          .order("trip_date", { ascending: true })
          .limit(5),
        listConciergeOffersForUnmatchedRequest(row.id),
      ]);

      return {
        id: row.id,
        routeLabel: `${row.pickup_suburb} to ${row.dropoff_suburb}`,
        itemLabel: row.item_description,
        notifyEmail: row.notify_email,
        createdAt: row.created_at,
        matchedAt: row.matched_at,
        moveRequestId: row.move_request_id,
        status: row.status as "active" | "notified" | "matched" | "expired",
        carrierSuggestions: (carrierSuggestions ?? []).map((listing) => ({
          listingId: listing.id,
          carrierId: listing.carrier_id,
          businessName:
            (listing.carriers as { business_name?: string } | null)?.business_name ?? "Carrier",
          tripDate: listing.trip_date,
          timeWindow: listing.time_window,
          basePriceCents: listing.price_cents,
        })),
        conciergeOffers,
      };
    }),
  );

  const sections = [
    { key: "active" as const, title: "Active route requests" },
    { key: "notified" as const, title: "Notified and waiting" },
    { key: "matched" as const, title: "Matched alerts" },
    { key: "expired" as const, title: "Expired alerts" },
  ].map((section) => ({
    ...section,
    items: items.filter((item) => item.status === section.key),
  }));

  return {
    sections,
    operatorTasks: operatorTasks
      .filter((task) => ["open", "in_progress"].includes(task.status))
      .sort((left, right) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (
          priorityOrder[left.priority] - priorityOrder[right.priority] ||
          (left.dueAt ?? "").localeCompare(right.dueAt ?? "") ||
          left.createdAt.localeCompare(right.createdAt)
        );
      }),
    notificationLogs: (notificationRows ?? []).map((row) => ({
      id: row.id,
      unmatchedRequestId: row.unmatched_request_id,
      customerId: row.customer_id,
      carrierId: row.carrier_id,
      channel: row.channel,
      status: row.status,
      dedupeKey: row.dedupe_key,
      sentAt: row.sent_at,
      failureReason: row.failure_reason,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {},
      createdAt: row.created_at,
    })),
    staleTrips: staleListings
      .map((listing) => {
        const lastAction = listingActionsById.get(listing.id);
        const bookingCount = impactedBookingCountByListing.get(listing.id) ?? 0;

        return {
          listingId: listing.id,
          routeLabel: `${listing.origin_suburb} to ${listing.destination_suburb}`,
          tripDate: listing.trip_date,
          bookingCount,
          freshnessMissCount: Number(listing.freshness_miss_count ?? 0),
          suspensionReason: listing.freshness_suspension_reason ?? null,
          status: listing.status === "suspended" ? ("suspended" as const) : ("watch" as const),
          lastActionAt: lastAction?.created_at ?? null,
          lastActionLabel: lastAction?.action_type ?? null,
          blocker:
            listing.status === "suspended"
              ? bookingCount > 0
                ? "Trip is suspended and live customer bookings need an ops decision now."
                : "Trip is suspended after a missed freshness check-in and still needs manual reconfirmation."
              : "Trip is inside a freshness window and still waiting on confirmation.",
        };
      })
      .sort((left, right) => {
        const statusOrder = { suspended: 0, watch: 1 };
        return (
          statusOrder[left.status] - statusOrder[right.status] ||
          right.bookingCount - left.bookingCount ||
          right.freshnessMissCount - left.freshnessMissCount ||
          left.tripDate.localeCompare(right.tripDate)
        );
      }),
  };
}
