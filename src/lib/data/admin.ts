import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sendBookingTransactionalEmail } from "@/lib/notifications";
import { captureAppError } from "@/lib/sentry";
import { getStripeServerClient } from "@/lib/stripe/client";
import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { sanitizeText } from "@/lib/utils";
import { getTripPublishReadiness } from "@/lib/validation/trip";
import type { ValidationMetric } from "@/types/admin";

export async function listAdminDisputes() {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*, booking:bookings(booking_reference,total_price_cents,status)")
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
    .select("*, booking:bookings(booking_reference,total_price_cents,status)")
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
      cancellationReason:
        params.bookingStatus === "cancelled"
          ? "Cancelled during dispute resolution"
          : undefined,
    });

    bookingPaymentStatus = booking.paymentStatus ?? null;
    stripePaymentIntentId = booking.stripePaymentIntentId ?? null;

    // When resolving a dispute as cancelled, trigger Stripe refund/cancellation
    if (params.bookingStatus === "cancelled" && process.env.STRIPE_SECRET_KEY) {
      if (stripePaymentIntentId) {
        try {
          const stripe = getStripeServerClient();

          if (bookingPaymentStatus === "authorized") {
            // Payment was authorised but not captured — cancel the intent
            await stripe.paymentIntents.cancel(stripePaymentIntentId);
          } else if (bookingPaymentStatus === "captured") {
            // Payment was captured — issue a full refund
            await stripe.refunds.create({
              payment_intent: stripePaymentIntentId,
            });
          }

          await supabase
            .from("bookings")
            .update({ payment_status: "refunded" })
            .eq("id", data.booking_id);
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
          html: `<p>Your moverrr dispute for booking <strong>${bookingParties?.booking_reference ?? data.booking_id}</strong> is now marked as ${params.status}. ${
            sanitizedResolutionNotes
          }</p>`,
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
          "id, trip_date, origin_suburb, destination_suburb, space_size, available_volume_m3, available_weight_kg, remaining_capacity_pct, special_notes, helper_available, stairs_ok, accepts_furniture, accepts_boxes, accepts_appliances, accepts_fragile, status",
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
        description: "Routes that are live but still read as low-confidence inventory.",
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
