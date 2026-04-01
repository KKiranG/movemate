import Stripe from "stripe";
import { NextResponse } from "next/server";

import { verifyStripeWebhookSignature } from "@/lib/stripe/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { captureAppError } from "@/lib/sentry";

function logWebhookContext(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown>,
) {
  console[level](`[stripe-webhook] ${message}`, context);
}

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit("stripe-webhook", 120, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Webhook throttled." }, { status: 429 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  try {
    const body = await request.text();
    const event = verifyStripeWebhookSignature(body, signature);

    if (event.type.startsWith("payment_intent.")) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.bookingId;
      const baseContext = {
        eventId: event.id,
        eventType: event.type,
        bookingId: bookingId ?? null,
        paymentIntentId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
      };

      if (!bookingId) {
        logWebhookContext("warn", "Missing booking metadata on payment intent event.", baseContext);
      }

      if (bookingId) {
        const supabase = createAdminClient();

        if (event.type === "payment_intent.payment_failed") {
          const failureMessage =
            paymentIntent.last_payment_error?.message ??
            paymentIntent.last_payment_error?.decline_code ??
            "Card authorization failed.";
          const { data: updatedRows, error: updateError } = await supabase
            .from("bookings")
            .update({
              payment_status: "failed",
              payment_failure_code: paymentIntent.last_payment_error?.decline_code ?? null,
              payment_failure_reason: failureMessage,
            })
            .eq("id", bookingId)
            .select("id");

          if (updateError || !updatedRows || updatedRows.length === 0) {
            logWebhookContext("error", "Failed to mark booking payment as failed.", baseContext);
            captureAppError(
              updateError ?? new Error(`Booking not found for webhook`),
              {
                feature: "payments",
                action: "webhook_payment_failed",
                tags: { bookingId, eventType: event.type },
              },
            );
          }
        }

        if (event.type === "payment_intent.canceled") {
          const { data: updatedRows, error: updateError } = await supabase
            .from("bookings")
            .update({
              payment_status: "authorization_cancelled",
              payment_failure_code: paymentIntent.cancellation_reason ?? null,
              payment_failure_reason:
                paymentIntent.cancellation_reason?.replace(/_/g, " ") ??
                "The authorization was cancelled before capture.",
            })
            .eq("id", bookingId)
            .select("id");

          if (updateError || !updatedRows || updatedRows.length === 0) {
            logWebhookContext(
              "error",
              "Failed to mark booking payment as authorization cancelled.",
              baseContext,
            );
            captureAppError(
              updateError ?? new Error(`Booking not found for webhook`),
              {
                feature: "payments",
                action: "webhook_payment_authorization_cancelled",
                tags: { bookingId, eventType: event.type },
              },
            );
          }
        }

        if (event.type === "payment_intent.amount_capturable_updated") {
          const { data: updatedRows, error: updateError } = await supabase
            .from("bookings")
            .update({ payment_status: "authorized" })
            .eq("id", bookingId)
            .select("id");

          if (updateError || !updatedRows || updatedRows.length === 0) {
            logWebhookContext(
              "error",
              "Failed to mark booking payment as authorized from capturable update.",
              baseContext,
            );
            captureAppError(
              updateError ?? new Error(`Booking not found for webhook`),
              {
                feature: "payments",
                action: "webhook_payment_authorized",
                tags: { bookingId, eventType: event.type },
              },
            );
          } else {
            logWebhookContext("info", "Booking payment marked authorized.", baseContext);
          }
        }

        if (event.type === "payment_intent.succeeded") {
          const { data: updatedRows, error: updateError } = await supabase
            .from("bookings")
            .update({ payment_status: "captured" })
            .eq("id", bookingId)
            .select("id");

          if (updateError || !updatedRows || updatedRows.length === 0) {
            logWebhookContext("error", "Failed to mark booking payment as captured.", baseContext);
            captureAppError(
              updateError ?? new Error(`Booking not found for webhook`),
              {
                feature: "payments",
                action: "webhook_payment_captured",
                tags: { bookingId, eventType: event.type },
              },
            );
          } else {
            logWebhookContext("info", "Booking payment marked captured.", baseContext);
          }
        }
      }
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook verification failed.",
      },
      { status: 400 },
    );
  }
}
