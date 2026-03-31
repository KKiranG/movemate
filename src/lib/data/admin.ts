import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sendTransactionalEmail } from "@/lib/notifications";
import { captureAppError } from "@/lib/sentry";
import { getStripeServerClient } from "@/lib/stripe/client";
import type { ValidationMetric } from "@/types/admin";

export async function listAdminDisputes() {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "admin_dispute_query_failed");
  }

  return data ?? [];
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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("disputes")
    .update({
      status: params.status,
      resolution_notes: params.resolutionNotes || null,
      resolved_by: params.status === "resolved" || params.status === "closed" ? params.resolvedBy : null,
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

  if (params.bookingStatus) {
    await supabase
      .from("bookings")
      .update({ status: params.bookingStatus })
      .eq("id", data.booking_id);

    // When resolving a dispute as cancelled, trigger Stripe refund/cancellation
    if (params.bookingStatus === "cancelled" && process.env.STRIPE_SECRET_KEY) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("stripe_payment_intent_id, payment_status")
        .eq("id", data.booking_id)
        .maybeSingle();

      if (booking?.stripe_payment_intent_id) {
        try {
          const stripe = getStripeServerClient();

          if (booking.payment_status === "authorized") {
            // Payment was authorised but not captured — cancel the intent
            await stripe.paymentIntents.cancel(booking.stripe_payment_intent_id);
          } else if (booking.payment_status === "captured") {
            // Payment was captured — issue a full refund
            await stripe.refunds.create({
              payment_intent: booking.stripe_payment_intent_id,
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
    .select("customer:customers(email), carrier:carriers(email)")
    .eq("id", data.booking_id)
    .single();

  const customerEmail = (bookingParties?.customer as { email?: string } | null)?.email;
  const carrierEmail = (bookingParties?.carrier as { email?: string } | null)?.email;

  await Promise.all(
    [customerEmail, carrierEmail]
      .filter((email): email is string => Boolean(email))
      .map((email) =>
        sendTransactionalEmail({
          to: email,
          subject: "Booking dispute updated",
          html: `<p>Your moverrr dispute is now marked as ${params.status}. ${
            params.resolutionNotes ? params.resolutionNotes : ""
          }</p>`,
        }),
      ),
  );

  return data;
}

export async function getValidationMetrics() {
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
      .select("id, status", { count: "exact" }),
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

  return [
    {
      label: "Active listings",
      value: listings.count ?? 0,
    },
    {
      label: "Search to booking starts",
      value: searchStarts > 0 ? Math.round((bookingStarts / searchStarts) * 100) : 0,
      changeLabel: "%",
    },
    {
      label: "Completed bookings",
      value: completedBookings,
    },
    {
      label: "Carrier reuse",
      value: repeatCarriers,
    },
    {
      label: "Open disputes",
      value: disputes.count ?? 0,
    },
  ];
}
