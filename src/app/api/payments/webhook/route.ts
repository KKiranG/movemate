import { NextResponse } from "next/server";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { verifyStripeWebhookSignature } from "@/lib/stripe/webhooks";
import { captureAppError } from "@/lib/sentry";
import {
  applyPaymentIntentEvent,
  createSupabaseBookingPaymentRepository,
} from "@/lib/stripe/payment-intent-events";
import { syncCarrierStripeOnboardingStatusByAccount } from "@/lib/stripe/connect";
import { createAdminClient } from "@/lib/supabase/admin";

function logWebhookContext(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown>,
) {
  console[level](`[stripe-webhook] ${message}`, context);
}

async function claimStripeWebhookEvent(eventId: string, eventType: string) {
  if (!hasSupabaseAdminEnv()) {
    logWebhookContext("warn", "Skipping webhook replay claim because Supabase admin is unavailable.", {
      eventId,
      eventType,
    });
    return true;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: eventId,
    event_type: eventType,
  });

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    return false;
  }

  throw new AppError(error.message, 500, "stripe_webhook_claim_failed");
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
    const claimed = await claimStripeWebhookEvent(event.id, event.type);

    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true, type: event.type });
    }

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

    if (event.type === "account.updated") {
      const account = event.data.object as { id: string };
      await syncCarrierStripeOnboardingStatusByAccount({
        accountId: account.id,
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
