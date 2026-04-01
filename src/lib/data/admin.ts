import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sendBookingTransactionalEmail } from "@/lib/notifications";
import { captureAppError } from "@/lib/sentry";
import { getStripeServerClient } from "@/lib/stripe/client";
import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { sanitizeText } from "@/lib/utils";
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
