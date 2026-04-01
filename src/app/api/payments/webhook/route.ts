import { NextResponse } from "next/server";

import { verifyStripeWebhookSignature } from "@/lib/stripe/webhooks";
import { captureAppError } from "@/lib/sentry";
import {
  applyPaymentIntentEvent,
  createSupabaseBookingPaymentRepository,
} from "@/lib/stripe/payment-intent-events";

function logWebhookContext(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown>,
) {
  console[level](`[stripe-webhook] ${message}`, context);
}

export async function POST(request: Request) {
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
      await applyPaymentIntentEvent(event, {
        repository: createSupabaseBookingPaymentRepository(),
        log: logWebhookContext,
        reportError: (error, context) =>
          captureAppError(error, {
            feature: "payments",
            action: context.action,
            tags: {
              bookingId: context.bookingId,
              eventType: context.eventType,
            },
          }),
      });
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
