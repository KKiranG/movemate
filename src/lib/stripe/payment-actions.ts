import { captureAppError } from "@/lib/sentry";
import { getStripeServerClient } from "@/lib/stripe/client";
import type { BookingPaymentStatus } from "@/types/booking";

export async function reverseBookingPayment(params: {
  supabase: {
    from: (table: "bookings") => {
      update: (patch: Record<string, unknown>) => {
        eq: (column: string, value: string) => unknown;
      };
    };
  };
  bookingId: string;
  paymentIntentId?: string | null;
  paymentStatus?: BookingPaymentStatus | null;
  feature: "bookings" | "admin";
  action: string;
  stripeClient?: ReturnType<typeof getStripeServerClient>;
}) {
  if (!process.env.STRIPE_SECRET_KEY || !params.paymentIntentId) {
    return { actionTaken: "none" as const, nextPaymentStatus: params.paymentStatus ?? null };
  }

  if (
    params.paymentStatus === "failed" ||
    params.paymentStatus === "authorization_cancelled" ||
    params.paymentStatus === "refunded"
  ) {
    return { actionTaken: "none" as const, nextPaymentStatus: params.paymentStatus ?? null };
  }

  try {
    const stripe = params.stripeClient ?? getStripeServerClient();
    const intent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

    if (
      params.paymentStatus === "captured" ||
      intent.status === "succeeded"
    ) {
      await stripe.refunds.create({
        payment_intent: params.paymentIntentId,
      });
      await params.supabase
        .from("bookings")
        .update({
          payment_status: "refunded",
          payment_failure_code: null,
          payment_failure_reason: null,
        })
        .eq("id", params.bookingId);

      return { actionTaken: "refunded" as const, nextPaymentStatus: "refunded" as const };
    }

    if (
      intent.status !== "canceled" &&
      (params.paymentStatus === "authorized" ||
        params.paymentStatus === "pending" ||
        params.paymentStatus === "capture_failed" ||
        intent.status === "requires_capture" ||
        intent.status === "requires_payment_method" ||
        intent.status === "requires_confirmation" ||
        intent.status === "processing")
    ) {
      await stripe.paymentIntents.cancel(params.paymentIntentId);
      await params.supabase
        .from("bookings")
        .update({
          payment_status: "authorization_cancelled",
        })
        .eq("id", params.bookingId);

      return {
        actionTaken: "authorization_cancelled" as const,
        nextPaymentStatus: "authorization_cancelled" as const,
      };
    }

    return { actionTaken: "none" as const, nextPaymentStatus: params.paymentStatus ?? null };
  } catch (error) {
    captureAppError(error, {
      feature: params.feature,
      action: params.action,
      tags: {
        bookingId: params.bookingId,
        paymentIntentId: params.paymentIntentId ?? "missing",
      },
    });
    throw error;
  }
}
