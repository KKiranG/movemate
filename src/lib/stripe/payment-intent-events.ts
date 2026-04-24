import Stripe from "stripe";

import { markBookingRequestPaymentAuthorizationFromWebhook } from "@/lib/data/booking-request-payments";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentStatusRecord = {
  id: string;
  payment_status: string | null;
};

export type PaymentIntentEventOutcome =
  | "ignored_event_type"
  | "missing_booking_metadata"
  | "request_authorization_not_found"
  | "marked_request_authorization_failed"
  | "marked_request_authorization_cancelled"
  | "marked_request_authorization_authorized"
  | "marked_request_authorization_captured"
  | "booking_not_found"
  | "marked_failed"
  | "marked_authorization_cancelled"
  | "marked_authorized"
  | "marked_captured"
  | "skipped_already_captured";

export type PaymentIntentEventResult = {
  bookingId: string | null;
  paymentAuthorizationId?: string | null;
  eventId: string;
  eventType: string;
  outcome: PaymentIntentEventOutcome;
};

export type PaymentEventLogger = (
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown>,
) => void;

export type PaymentEventReporter = (
  error: unknown,
  context: {
    action: string;
    bookingId: string;
    eventType: string;
  },
) => void;

export interface BookingPaymentRepository {
  getBooking(bookingId: string): Promise<PaymentStatusRecord | null>;
  markFailed(params: {
    bookingId: string;
    failureCode: string | null;
    failureReason: string;
  }): Promise<boolean>;
  markAuthorizationCancelled(params: {
    bookingId: string;
    failureCode: string | null;
    failureReason: string;
  }): Promise<boolean>;
  markAuthorized(bookingId: string): Promise<boolean>;
  markCaptured(bookingId: string): Promise<boolean>;
}

async function updateBookingById(
  supabase: ReturnType<typeof createAdminClient>,
  bookingId: string,
  patch: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)
    .select("id")
    .maybeSingle();

  return { ok: !error && Boolean(data), error };
}

export function createSupabaseBookingPaymentRepository(
  supabase = createAdminClient(),
): BookingPaymentRepository {
  return {
    async getBooking(bookingId) {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, payment_status")
        .eq("id", bookingId)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data;
    },
    async markFailed({ bookingId, failureCode, failureReason }) {
      const result = await updateBookingById(supabase, bookingId, {
        payment_status: "failed",
        payment_failure_code: failureCode,
        payment_failure_reason: failureReason,
      });

      return result.ok;
    },
    async markAuthorizationCancelled({ bookingId, failureCode, failureReason }) {
      const result = await updateBookingById(supabase, bookingId, {
        payment_status: "authorization_cancelled",
        payment_failure_code: failureCode,
        payment_failure_reason: failureReason,
      });

      return result.ok;
    },
    async markAuthorized(bookingId) {
      const result = await updateBookingById(supabase, bookingId, {
        payment_status: "authorized",
      });

      return result.ok;
    },
    async markCaptured(bookingId) {
      const result = await updateBookingById(supabase, bookingId, {
        payment_status: "captured",
        payment_failure_code: null,
        payment_failure_reason: null,
      });

      return result.ok;
    },
  };
}

function createBaseContext(event: Stripe.Event, paymentIntent: Stripe.PaymentIntent, bookingId: string | null) {
  return {
    bookingId,
    paymentAuthorizationId: paymentIntent.metadata?.paymentAuthorizationId ?? null,
    eventId: event.id,
    eventType: event.type,
    paymentIntentId: paymentIntent.id,
    paymentIntentStatus: paymentIntent.status,
  };
}

async function applyRequestAuthorizationPaymentIntentEvent(params: {
  event: Stripe.Event;
  paymentIntent: Stripe.PaymentIntent;
  paymentAuthorizationId: string;
  log?: PaymentEventLogger;
}): Promise<PaymentIntentEventResult> {
  const { event, paymentIntent, paymentAuthorizationId } = params;

  if (event.type === "payment_intent.payment_failed") {
    const failureReason =
      paymentIntent.last_payment_error?.message ??
      paymentIntent.last_payment_error?.decline_code ??
      "Card authorization failed.";
    const authorization = await markBookingRequestPaymentAuthorizationFromWebhook({
      paymentAuthorizationId,
      stripePaymentIntentId: paymentIntent.id,
      status: "failed",
      failureCode: paymentIntent.last_payment_error?.decline_code ?? null,
      failureReason,
    });

    return {
      bookingId: null,
      paymentAuthorizationId,
      eventId: event.id,
      eventType: event.type,
      outcome: authorization ? "marked_request_authorization_failed" : "request_authorization_not_found",
    };
  }

  if (event.type === "payment_intent.canceled") {
    const authorization = await markBookingRequestPaymentAuthorizationFromWebhook({
      paymentAuthorizationId,
      stripePaymentIntentId: paymentIntent.id,
      status: "authorization_cancelled",
      failureCode: paymentIntent.cancellation_reason ?? null,
      failureReason:
        paymentIntent.cancellation_reason?.replace(/_/g, " ") ??
        "The request authorization was cancelled before carrier acceptance.",
    });

    return {
      bookingId: null,
      paymentAuthorizationId,
      eventId: event.id,
      eventType: event.type,
      outcome: authorization
        ? "marked_request_authorization_cancelled"
        : "request_authorization_not_found",
    };
  }

  if (event.type === "payment_intent.amount_capturable_updated") {
    const authorization = await markBookingRequestPaymentAuthorizationFromWebhook({
      paymentAuthorizationId,
      stripePaymentIntentId: paymentIntent.id,
      status: "authorized",
    });

    params.log?.("info", "Request payment authorization marked authorized.", {
      paymentAuthorizationId,
      eventId: event.id,
      eventType: event.type,
      paymentIntentId: paymentIntent.id,
      paymentIntentStatus: paymentIntent.status,
    });

    return {
      bookingId: null,
      paymentAuthorizationId,
      eventId: event.id,
      eventType: event.type,
      outcome: authorization
        ? "marked_request_authorization_authorized"
        : "request_authorization_not_found",
    };
  }

  if (event.type === "payment_intent.succeeded") {
    const authorization = await markBookingRequestPaymentAuthorizationFromWebhook({
      paymentAuthorizationId,
      stripePaymentIntentId: paymentIntent.id,
      status: "captured",
      capturedAmountCents: paymentIntent.amount_received || paymentIntent.amount,
    });

    params.log?.("info", "Request payment authorization marked captured.", {
      paymentAuthorizationId,
      eventId: event.id,
      eventType: event.type,
      paymentIntentId: paymentIntent.id,
      paymentIntentStatus: paymentIntent.status,
    });

    return {
      bookingId: null,
      paymentAuthorizationId,
      eventId: event.id,
      eventType: event.type,
      outcome: authorization
        ? "marked_request_authorization_captured"
        : "request_authorization_not_found",
    };
  }

  return {
    bookingId: null,
    paymentAuthorizationId,
    eventId: event.id,
    eventType: event.type,
    outcome: "ignored_event_type",
  };
}

function reportRepositoryFailure(params: {
  bookingId: string;
  eventType: string;
  action: string;
  log?: PaymentEventLogger;
  reportError?: PaymentEventReporter;
  message: string;
}) {
  params.log?.("error", params.message, {
    bookingId: params.bookingId,
    eventType: params.eventType,
  });
  params.reportError?.(new Error(params.message), {
    action: params.action,
    bookingId: params.bookingId,
    eventType: params.eventType,
  });
}

export async function applyPaymentIntentEvent(
  event: Stripe.Event,
  params: {
    repository: BookingPaymentRepository;
    log?: PaymentEventLogger;
    reportError?: PaymentEventReporter;
  },
): Promise<PaymentIntentEventResult> {
  if (!event.type.startsWith("payment_intent.")) {
    return {
      bookingId: null,
      eventId: event.id,
      eventType: event.type,
      outcome: "ignored_event_type",
    };
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const bookingId = paymentIntent.metadata?.bookingId ?? null;
  const paymentAuthorizationId = paymentIntent.metadata?.paymentAuthorizationId ?? null;
  const context = createBaseContext(event, paymentIntent, bookingId);

  if (!bookingId) {
    if (paymentAuthorizationId) {
      return applyRequestAuthorizationPaymentIntentEvent({
        event,
        paymentIntent,
        paymentAuthorizationId,
        log: params.log,
      });
    }

    params.log?.("warn", "Missing booking metadata on payment intent event.", context);
    return {
      bookingId,
      paymentAuthorizationId,
      eventId: event.id,
      eventType: event.type,
      outcome: "missing_booking_metadata",
    };
  }

  if (event.type === "payment_intent.payment_failed") {
    const failureReason =
      paymentIntent.last_payment_error?.message ??
      paymentIntent.last_payment_error?.decline_code ??
      "Card authorization failed.";
    const updated = await params.repository.markFailed({
      bookingId,
      failureCode: paymentIntent.last_payment_error?.decline_code ?? null,
      failureReason,
    });

    if (!updated) {
      reportRepositoryFailure({
        bookingId,
        eventType: event.type,
        action: "webhook_payment_failed",
        log: params.log,
        reportError: params.reportError,
        message: "Failed to mark booking payment as failed.",
      });

      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "booking_not_found",
      };
    }

    return {
      bookingId,
      eventId: event.id,
      eventType: event.type,
      outcome: "marked_failed",
    };
  }

  if (event.type === "payment_intent.canceled") {
    const updated = await params.repository.markAuthorizationCancelled({
      bookingId,
      failureCode: paymentIntent.cancellation_reason ?? null,
      failureReason:
        paymentIntent.cancellation_reason?.replace(/_/g, " ") ??
        "The authorization was cancelled before capture.",
    });

    if (!updated) {
      reportRepositoryFailure({
        bookingId,
        eventType: event.type,
        action: "webhook_payment_authorization_cancelled",
        log: params.log,
        reportError: params.reportError,
        message: "Failed to mark booking payment as authorization cancelled.",
      });

      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "booking_not_found",
      };
    }

    return {
      bookingId,
      eventId: event.id,
      eventType: event.type,
      outcome: "marked_authorization_cancelled",
    };
  }

  if (event.type === "payment_intent.amount_capturable_updated") {
    const booking = await params.repository.getBooking(bookingId);

    if (!booking) {
      reportRepositoryFailure({
        bookingId,
        eventType: event.type,
        action: "webhook_payment_authorized",
        log: params.log,
        reportError: params.reportError,
        message: "Booking not found for capturable update.",
      });

      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "booking_not_found",
      };
    }

    if (booking.payment_status === "captured") {
      params.log?.("info", "Skipping capturable update for already captured booking.", context);
      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "skipped_already_captured",
      };
    }

    const updated = await params.repository.markAuthorized(bookingId);

    if (!updated) {
      reportRepositoryFailure({
        bookingId,
        eventType: event.type,
        action: "webhook_payment_authorized",
        log: params.log,
        reportError: params.reportError,
        message: "Failed to mark booking payment as authorized from capturable update.",
      });

      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "booking_not_found",
      };
    }

    params.log?.("info", "Booking payment marked authorized.", context);
    return {
      bookingId,
      eventId: event.id,
      eventType: event.type,
      outcome: "marked_authorized",
    };
  }

  if (event.type === "payment_intent.succeeded") {
    const booking = await params.repository.getBooking(bookingId);

    if (!booking) {
      reportRepositoryFailure({
        bookingId,
        eventType: event.type,
        action: "webhook_payment_captured",
        log: params.log,
        reportError: params.reportError,
        message: "Booking not found for payment succeeded event.",
      });

      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "booking_not_found",
      };
    }

    if (booking.payment_status === "captured") {
      params.log?.("info", "Skipping payment succeeded update for already captured booking.", context);
      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "skipped_already_captured",
      };
    }

    const updated = await params.repository.markCaptured(bookingId);

    if (!updated) {
      reportRepositoryFailure({
        bookingId,
        eventType: event.type,
        action: "webhook_payment_captured",
        log: params.log,
        reportError: params.reportError,
        message: "Failed to mark booking payment as captured.",
      });

      return {
        bookingId,
        eventId: event.id,
        eventType: event.type,
        outcome: "booking_not_found",
      };
    }

    params.log?.("info", "Booking payment marked captured.", context);
    return {
      bookingId,
      eventId: event.id,
      eventType: event.type,
      outcome: "marked_captured",
    };
  }

  return {
    bookingId,
    eventId: event.id,
    eventType: event.type,
    outcome: "ignored_event_type",
  };
}
