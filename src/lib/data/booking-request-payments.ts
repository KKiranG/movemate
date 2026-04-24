import { randomUUID } from "node:crypto";

import Stripe from "stripe";

import { hasStripeEnv, hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getStripeServerClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  BookingRequestPaymentAuthorization,
  BookingRequestPaymentAuthorizationStatus,
} from "@/types/booking-request";
import type { Database } from "@/types/database";

type PaymentAuthorizationRow =
  Database["public"]["Tables"]["booking_request_payment_authorizations"]["Row"];
type PaymentAuthorizationInsert =
  Database["public"]["Tables"]["booking_request_payment_authorizations"]["Insert"];

function toPaymentAuthorization(
  row: PaymentAuthorizationRow,
): BookingRequestPaymentAuthorization {
  return {
    id: row.id,
    moveRequestId: row.move_request_id,
    customerId: row.customer_id,
    requestGroupId: row.request_group_id,
    bookingId: row.booking_id,
    amountCents: row.amount_cents,
    capturedAmountCents: row.captured_amount_cents,
    currency: row.currency,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    status: row.status,
    failureCode: row.failure_code,
    failureReason: row.failure_reason,
    authorizedAt: row.authorized_at,
    capturedAt: row.captured_at,
    cancelledAt: row.cancelled_at,
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normaliseStripeFailure(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return {
      code: error.code ?? error.type ?? "stripe_error",
      reason: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: "stripe_error",
      reason: error.message,
    };
  }

  return {
    code: "stripe_error",
    reason: "Stripe request failed.",
  };
}

async function updateAuthorization(params: {
  authorizationId: string;
  patch: Database["public"]["Tables"]["booking_request_payment_authorizations"]["Update"];
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_request_payment_authorizations")
    .update(params.patch)
    .eq("id", params.authorizationId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "payment_authorization_update_failed");
  }

  return toPaymentAuthorization(data as PaymentAuthorizationRow);
}

async function getPaymentAuthorizationById(authorizationId: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_request_payment_authorizations")
    .select("*")
    .eq("id", authorizationId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "payment_authorization_lookup_failed");
  }

  if (!data) {
    throw new AppError("Payment authorization not found.", 404, "payment_authorization_not_found");
  }

  return toPaymentAuthorization(data as PaymentAuthorizationRow);
}

async function getPaymentAuthorizationByStripeIntentId(paymentIntentId: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_request_payment_authorizations")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "payment_authorization_lookup_failed");
  }

  return data ? toPaymentAuthorization(data as PaymentAuthorizationRow) : null;
}

async function getCustomerPaymentInstrument(params: {
  userId: string;
  customerId: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, user_id, stripe_customer_id, stripe_default_payment_method_id")
    .eq("id", params.customerId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "customer_payment_lookup_failed");
  }

  if (!data) {
    throw new AppError("Customer profile not found.", 404, "customer_not_found");
  }

  return data as {
    id: string;
    user_id: string;
    stripe_customer_id: string | null;
    stripe_default_payment_method_id: string | null;
  };
}

export async function createBookingRequestPaymentAuthorization(params: {
  userId: string;
  customerId: string;
  moveRequestId: string;
  amountCents: number;
  requestGroupId?: string | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const authorizationId = randomUUID();
  const supabase = createAdminClient();
  const insertPayload: PaymentAuthorizationInsert = {
    id: authorizationId,
    move_request_id: params.moveRequestId,
    customer_id: params.customerId,
    request_group_id: params.requestGroupId ?? null,
    amount_cents: params.amountCents,
    currency: "aud",
    status: "pending",
  };

  const { error: insertError } = await supabase
    .from("booking_request_payment_authorizations")
    .insert(insertPayload);

  if (insertError) {
    throw new AppError(insertError.message, 500, "payment_authorization_create_failed");
  }

  if (!hasStripeEnv()) {
    return updateAuthorization({
      authorizationId,
      patch: {
        status: "authorized",
        authorized_at: new Date().toISOString(),
        failure_code: null,
        failure_reason: null,
      },
    });
  }

  const paymentInstrument = await getCustomerPaymentInstrument({
    userId: params.userId,
    customerId: params.customerId,
  });

  if (
    !paymentInstrument.stripe_customer_id ||
    !paymentInstrument.stripe_default_payment_method_id
  ) {
    await updateAuthorization({
      authorizationId,
      patch: {
        status: "failed",
        failure_code: "payment_method_required",
        failure_reason: "A saved payment method is required before sending this request.",
      },
    });

    throw new AppError(
      "Add a saved card before authorising this request.",
      402,
      "payment_method_required",
    );
  }

  const stripe = getStripeServerClient();

  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: params.amountCents,
        currency: "aud",
        customer: paymentInstrument.stripe_customer_id,
        payment_method: paymentInstrument.stripe_default_payment_method_id,
        capture_method: "manual",
        confirm: true,
        off_session: true,
        metadata: {
          paymentAuthorizationId: authorizationId,
          moveRequestId: params.moveRequestId,
          customerId: params.customerId,
          requestGroupId: params.requestGroupId ?? "",
          flow: "booking_request_authorization",
        },
      },
      {
        idempotencyKey: `booking-request-auth:${authorizationId}:${params.amountCents}`,
      },
    );

    if (intent.status !== "requires_capture") {
      await updateAuthorization({
        authorizationId,
        patch: {
          stripe_payment_intent_id: intent.id,
          status: "failed",
          failure_code: `unexpected_${intent.status}`,
          failure_reason: "Stripe did not return an authorized manual-capture payment intent.",
        },
      });

      throw new AppError(
        "Payment authorization could not be completed with this saved card.",
        402,
        "payment_authorization_not_capturable",
      );
    }

    return updateAuthorization({
      authorizationId,
      patch: {
        stripe_payment_intent_id: intent.id,
        status: "authorized",
        authorized_at: new Date().toISOString(),
        failure_code: null,
        failure_reason: null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const failure = normaliseStripeFailure(error);
    await updateAuthorization({
      authorizationId,
      patch: {
        status: "failed",
        failure_code: failure.code,
        failure_reason: failure.reason,
      },
    });

    throw new AppError(
      "Payment authorization failed. Update your saved card and try again.",
      402,
      "payment_authorization_failed",
    );
  }
}

export async function captureBookingRequestPaymentAuthorization(params: {
  paymentAuthorizationId: string;
  amountToCaptureCents?: number;
}) {
  const authorization = await getPaymentAuthorizationById(params.paymentAuthorizationId);

  if (authorization.status === "captured") {
    return authorization;
  }

  if (authorization.status !== "authorized") {
    throw new AppError(
      "This request does not have an authorized payment to capture.",
      409,
      "payment_authorization_not_ready",
    );
  }

  if (!hasStripeEnv()) {
    return updateAuthorization({
      authorizationId: authorization.id,
      patch: {
        status: "captured",
        captured_amount_cents: params.amountToCaptureCents ?? authorization.amountCents,
        captured_at: new Date().toISOString(),
        failure_code: null,
        failure_reason: null,
      },
    });
  }

  if (!authorization.stripePaymentIntentId) {
    throw new AppError(
      "No Stripe payment intent is attached to this authorization.",
      409,
      "payment_intent_missing",
    );
  }

  const stripe = getStripeServerClient();

  try {
    const intent = await stripe.paymentIntents.retrieve(authorization.stripePaymentIntentId);

    if (intent.status === "succeeded") {
      return updateAuthorization({
        authorizationId: authorization.id,
        patch: {
          status: "captured",
          captured_amount_cents: params.amountToCaptureCents ?? authorization.amountCents,
          captured_at: new Date().toISOString(),
          failure_code: null,
          failure_reason: null,
        },
      });
    }

    if (intent.status !== "requires_capture") {
      throw new AppError(
        "Stripe payment intent is no longer capturable.",
        409,
        "payment_not_capturable",
      );
    }

    const amountToCapture = params.amountToCaptureCents ?? authorization.amountCents;
    const capturedIntent = await stripe.paymentIntents.capture(
      intent.id,
      { amount_to_capture: amountToCapture },
      {
        idempotencyKey: `booking-request-auth-capture:${authorization.id}:${amountToCapture}`,
      },
    );

    if (capturedIntent.status !== "succeeded") {
      throw new AppError(
        "Stripe capture did not complete.",
        409,
        "payment_capture_incomplete",
      );
    }

    return updateAuthorization({
      authorizationId: authorization.id,
      patch: {
        status: "captured",
        captured_amount_cents: amountToCapture,
        captured_at: new Date().toISOString(),
        failure_code: null,
        failure_reason: null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      await updateAuthorization({
        authorizationId: authorization.id,
        patch: {
          status: "capture_failed",
          failure_code: error.code,
          failure_reason: error.message,
        },
      });
      throw error;
    }

    const failure = normaliseStripeFailure(error);
    await updateAuthorization({
      authorizationId: authorization.id,
      patch: {
        status: "capture_failed",
        failure_code: failure.code,
        failure_reason: failure.reason,
      },
    });

    throw new AppError(
      "Payment capture failed, so this request was not accepted.",
      409,
      "payment_capture_failed",
    );
  }
}

export async function cancelBookingRequestPaymentAuthorizationIfUnused(params: {
  paymentAuthorizationId: string;
  failureCode: string;
  failureReason: string;
}) {
  const authorization = await getPaymentAuthorizationById(params.paymentAuthorizationId);

  if (["captured", "manual_review", "refund_pending", "refunded"].includes(authorization.status)) {
    return authorization;
  }

  const supabase = createAdminClient();
  const { data: requests, error } = await supabase
    .from("booking_requests")
    .select("id, status, booking_id")
    .eq("payment_authorization_id", authorization.id);

  if (error) {
    throw new AppError(error.message, 500, "payment_authorization_request_lookup_failed");
  }

  const stillNeedsAuthorization = (requests ?? []).some((request) =>
    ["pending", "clarification_requested", "accepting", "accepted"].includes(request.status) ||
    Boolean(request.booking_id),
  );

  if (stillNeedsAuthorization) {
    return authorization;
  }

  if (!hasStripeEnv() || !authorization.stripePaymentIntentId) {
    return updateAuthorization({
      authorizationId: authorization.id,
      patch: {
        status: "authorization_cancelled",
        cancelled_at: new Date().toISOString(),
        failure_code: params.failureCode,
        failure_reason: params.failureReason,
      },
    });
  }

  const stripe = getStripeServerClient();

  try {
    const intent = await stripe.paymentIntents.retrieve(authorization.stripePaymentIntentId);

    if (intent.status === "succeeded") {
      return updateAuthorization({
        authorizationId: authorization.id,
        patch: {
          status: "manual_review",
          failure_code: "cancel_after_capture",
          failure_reason:
            "A request group became terminal after Stripe reported capture. Manual review is required.",
        },
      });
    }

    if (!["canceled", "requires_capture", "requires_payment_method", "requires_confirmation"].includes(intent.status)) {
      return authorization;
    }

    if (intent.status !== "canceled") {
      await stripe.paymentIntents.cancel(intent.id, undefined, {
        idempotencyKey: `booking-request-auth-cancel:${authorization.id}`,
      });
    }

    return updateAuthorization({
      authorizationId: authorization.id,
      patch: {
        status: "authorization_cancelled",
        cancelled_at: new Date().toISOString(),
        failure_code: params.failureCode,
        failure_reason: params.failureReason,
      },
    });
  } catch (error) {
    const failure = normaliseStripeFailure(error);
    return updateAuthorization({
      authorizationId: authorization.id,
      patch: {
        failure_code: failure.code,
        failure_reason: failure.reason,
      },
    });
  }
}

export async function attachCapturedAuthorizationToBooking(params: {
  paymentAuthorizationId: string;
  bookingId: string;
}) {
  const authorization = await getPaymentAuthorizationById(params.paymentAuthorizationId);

  if (authorization.status !== "captured") {
    throw new AppError(
      "Only captured authorizations can be attached to a booking.",
      409,
      "payment_authorization_not_captured",
    );
  }

  const supabase = createAdminClient();
  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      stripe_payment_intent_id: authorization.stripePaymentIntentId ?? null,
      payment_status: "captured",
      payment_failure_code: null,
      payment_failure_reason: null,
    })
    .eq("id", params.bookingId);

  if (bookingError) {
    throw new AppError(bookingError.message, 500, "booking_payment_attach_failed");
  }

  return updateAuthorization({
    authorizationId: authorization.id,
    patch: {
      booking_id: params.bookingId,
      status: "captured" satisfies BookingRequestPaymentAuthorizationStatus,
    },
  });
}

export async function markCapturedAuthorizationNeedsManualReview(params: {
  paymentAuthorizationId: string;
  reason: string;
}) {
  return updateAuthorization({
    authorizationId: params.paymentAuthorizationId,
    patch: {
      status: "manual_review",
      failure_code: "captured_without_booking",
      failure_reason: params.reason,
    },
  });
}

export async function markBookingRequestPaymentAuthorizationFromWebhook(params: {
  paymentAuthorizationId?: string | null;
  stripePaymentIntentId: string;
  status: BookingRequestPaymentAuthorizationStatus;
  capturedAmountCents?: number | null;
  failureCode?: string | null;
  failureReason?: string | null;
}) {
  let authorization: BookingRequestPaymentAuthorization | null = null;

  try {
    authorization = params.paymentAuthorizationId
      ? await getPaymentAuthorizationById(params.paymentAuthorizationId)
      : await getPaymentAuthorizationByStripeIntentId(params.stripePaymentIntentId);
  } catch (error) {
    if (error instanceof AppError && error.code === "payment_authorization_not_found") {
      return null;
    }

    throw error;
  }

  if (!authorization) {
    return null;
  }

  const now = new Date().toISOString();
  const patch: Database["public"]["Tables"]["booking_request_payment_authorizations"]["Update"] = {
    stripe_payment_intent_id: authorization.stripePaymentIntentId ?? params.stripePaymentIntentId,
    status: params.status,
    failure_code: params.failureCode ?? null,
    failure_reason: params.failureReason ?? null,
  };

  if (params.status === "authorized") {
    patch.authorized_at = authorization.authorizedAt ?? now;
  }

  if (params.status === "captured") {
    patch.captured_at = authorization.capturedAt ?? now;
    patch.captured_amount_cents = params.capturedAmountCents ?? authorization.capturedAmountCents ?? authorization.amountCents;
  }

  if (params.status === "authorization_cancelled") {
    patch.cancelled_at = authorization.cancelledAt ?? now;
  }

  return updateAuthorization({
    authorizationId: authorization.id,
    patch,
  });
}
