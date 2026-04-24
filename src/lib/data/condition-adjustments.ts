import { buildBookingEmail } from "@/lib/email";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { reverseBookingPayment } from "@/lib/stripe/payment-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/utils";
import {
  getBookingActorRoleForUser,
  getBookingByIdForUser,
  updateBookingStatusForActor,
} from "@/lib/data/bookings";
import { sendBookingTransactionalEmail } from "@/lib/notifications";
import { getConditionAdjustmentReasonLabel } from "@/lib/validation/condition-adjustment";
import type { ConditionAdjustment } from "@/types/condition-adjustment";
import type { Database } from "@/types/database";

type ConditionAdjustmentRow =
  Database["public"]["Tables"]["condition_adjustments"]["Row"];

function toConditionAdjustment(row: ConditionAdjustmentRow): ConditionAdjustment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    carrierId: row.carrier_id,
    customerId: row.customer_id,
    reasonCode: row.reason_code,
    amountCents: row.amount_cents,
    status: row.status,
    note: row.note,
    customerResponseNote: row.customer_response_note,
    responseDeadlineAt: row.response_deadline_at,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getConditionAdjustmentParticipants(params: {
  customerId: string;
  carrierId: string;
}) {
  const supabase = createAdminClient();
  const [{ data: customer }, { data: carrier }] = await Promise.all([
    supabase
      .from("customers")
      .select("email")
      .eq("id", params.customerId)
      .maybeSingle(),
    supabase
      .from("carriers")
      .select("email, business_name")
      .eq("id", params.carrierId)
      .maybeSingle(),
  ]);

  return {
    customerEmail: customer?.email ?? null,
    carrierEmail: carrier?.email ?? null,
    carrierBusinessName: carrier?.business_name ?? "Carrier",
  };
}

async function recordConditionAdjustmentBookingEvent(params: {
  bookingId: string;
  actorRole: "carrier" | "customer" | "system";
  actorUserId?: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const supabase = createAdminClient();
  await supabase.from("booking_events").insert({
    booking_id: params.bookingId,
    actor_role: params.actorRole,
    actor_user_id: params.actorUserId ?? null,
    event_type: params.eventType,
    metadata: params.metadata,
  });
}

async function expireConditionAdjustmentIfNeeded(row: ConditionAdjustmentRow) {
  if (row.status !== "pending") {
    return toConditionAdjustment(row);
  }

  if (new Date(row.response_deadline_at).getTime() > Date.now()) {
    return toConditionAdjustment(row);
  }

  if (!hasSupabaseAdminEnv()) {
    return {
      ...toConditionAdjustment(row),
      status: "expired" as const,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("condition_adjustments")
    .update({
      status: "expired",
      responded_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "condition_adjustment_expire_failed");
  }

  const effective = (data as ConditionAdjustmentRow | null) ?? row;

  await recordConditionAdjustmentBookingEvent({
    bookingId: effective.booking_id,
    actorRole: "system",
    eventType: "condition_adjustment_expired",
    metadata: {
      conditionAdjustmentId: effective.id,
      reasonCode: effective.reason_code,
      amountCents: effective.amount_cents,
    },
  });

  return toConditionAdjustment({
    ...effective,
    status: "expired",
  });
}

export async function listConditionAdjustmentsForBookingUser(
  userId: string,
  bookingId: string,
) {
  const booking = await getBookingByIdForUser(userId, bookingId);

  if (!booking || !hasSupabaseAdminEnv()) {
    return [] as ConditionAdjustment[];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("condition_adjustments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "condition_adjustment_query_failed");
  }

  return Promise.all(
    ((data ?? []) as ConditionAdjustmentRow[]).map((row) =>
      expireConditionAdjustmentIfNeeded(row),
    ),
  );
}

export async function listConditionAdjustmentsForAdmin(params?: {
  bookingId?: string;
  status?: ConditionAdjustment["status"];
  limit?: number;
}) {
  if (!hasSupabaseAdminEnv()) {
    return [] as ConditionAdjustment[];
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("condition_adjustments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(params?.limit ?? 50);

  if (params?.bookingId) {
    query = query.eq("booking_id", params.bookingId);
  }

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 500, "condition_adjustment_admin_query_failed");
  }

  return Promise.all(
    ((data ?? []) as ConditionAdjustmentRow[]).map((row) =>
      expireConditionAdjustmentIfNeeded(row),
    ),
  );
}

export async function createConditionAdjustmentForCarrier(params: {
  userId: string;
  bookingId: string;
  reasonCode: ConditionAdjustment["reasonCode"];
  amountCents: number;
  note?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const actorRole = await getBookingActorRoleForUser(params.userId, params.bookingId);

  if (actorRole !== "carrier") {
    throw new AppError("Carrier access required.", 403, "forbidden");
  }

  const booking = await getBookingByIdForUser(params.userId, params.bookingId);

  if (!booking) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  if (booking.status !== "confirmed") {
    throw new AppError(
      "Condition adjustments are only available before pickup starts.",
      409,
      "condition_adjustment_not_allowed",
    );
  }

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("condition_adjustments")
    .select("*")
    .eq("booking_id", booking.id)
    .maybeSingle();

  if (existingError) {
    throw new AppError(existingError.message, 500, "condition_adjustment_lookup_failed");
  }

  if (existing) {
    throw new AppError(
      "MoveMate allows only one condition adjustment round per booking.",
      409,
      "condition_adjustment_already_exists",
    );
  }

  const note = params.note ? sanitizeText(params.note) : null;
  const { data, error } = await supabase
    .from("condition_adjustments")
    .insert({
      booking_id: booking.id,
      carrier_id: booking.carrierId,
      customer_id: booking.customerId,
      reason_code: params.reasonCode,
      amount_cents: params.amountCents,
      note,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "condition_adjustment_create_failed");
  }

  await recordConditionAdjustmentBookingEvent({
    bookingId: booking.id,
    actorRole: "carrier",
    actorUserId: params.userId,
    eventType: "condition_adjustment_requested",
    metadata: {
      conditionAdjustmentId: data.id,
      reasonCode: data.reason_code,
      amountCents: data.amount_cents,
      note,
    },
  });

  const participants = await getConditionAdjustmentParticipants({
    customerId: booking.customerId,
    carrierId: booking.carrierId,
  });

  if (participants.customerEmail) {
    await sendBookingTransactionalEmail({
      bookingId: booking.id,
      bookingStatus: booking.status,
      emailType: "condition_adjustment_requested",
      to: participants.customerEmail,
      subject: `Booking ${booking.bookingReference}: customer action needed`,
      html: buildBookingEmail({
        eyebrow: "Condition adjustment",
        title: "The carrier reported a material mismatch at pickup",
        intro:
          "MoveMate has opened one structured adjustment round. Review the reason and respond inside the booking record.",
        bookingReference: booking.bookingReference,
        routeLabel: `${booking.pickupSuburb ?? "Pickup"} to ${booking.dropoffSuburb ?? "Drop-off"}`,
        ctaPath: `/bookings/${booking.id}`,
        ctaLabel: "Review booking",
        bodyLines: [
          `${participants.carrierBusinessName} reported ${getConditionAdjustmentReasonLabel(data.reason_code)}.`,
          `Adjustment amount: ${new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
            maximumFractionDigits: 0,
          }).format(data.amount_cents / 100)}.`,
          note ?? "No additional carrier note was recorded.",
        ],
      }),
    });
  }

  return toConditionAdjustment(data as ConditionAdjustmentRow);
}

export async function respondToConditionAdjustment(params: {
  userId: string;
  adjustmentId: string;
  action: "accept" | "reject";
  customerResponseNote?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const sessionSupabase = createServerSupabaseClient();
  const { data: customer } = await sessionSupabase
    .from("customers")
    .select("id")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (!customer) {
    throw new AppError("Customer access required.", 403, "forbidden");
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("condition_adjustments")
    .select("*")
    .eq("id", params.adjustmentId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "condition_adjustment_lookup_failed");
  }

  if (!row) {
    throw new AppError("Condition adjustment not found.", 404, "condition_adjustment_not_found");
  }

  const active = await expireConditionAdjustmentIfNeeded(row as ConditionAdjustmentRow);

  if (active.status !== "pending") {
    throw new AppError(
      "This condition adjustment is no longer awaiting a customer response.",
      409,
      "condition_adjustment_closed",
    );
  }

  const responseNote = params.customerResponseNote
    ? sanitizeText(params.customerResponseNote)
    : null;
  const booking = await getBookingByIdForUser(params.userId, active.bookingId);

  if (!booking) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  const respondedAt = new Date().toISOString();

  if (params.action === "accept") {
    const recalculatedPricing = calculateBookingBreakdown({
      basePriceCents: booking.pricing.basePriceCents,
      needsStairs: booking.pricing.stairsFeeCents > 0,
      stairsExtraCents: booking.pricing.stairsFeeCents,
      needsHelper: booking.pricing.helperFeeCents > 0,
      helperExtraCents: booking.pricing.helperFeeCents,
      adjustmentFeeCents: active.amountCents,
    });

    if (booking.stripePaymentIntentId && process.env.STRIPE_SECRET_KEY) {
      try {
        await reverseBookingPayment({
          supabase,
          bookingId: booking.id,
          paymentIntentId: booking.stripePaymentIntentId,
          paymentStatus: booking.paymentStatus,
          feature: "bookings",
          action: "accepted_adjustment_payment_reversal",
        });
      } catch {
        // Best effort only. The new booking state below still forces payment recovery.
      }
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        adjustment_fee_cents: active.amountCents,
        total_price_cents: recalculatedPricing.totalPriceCents,
        carrier_payout_cents: recalculatedPricing.carrierPayoutCents,
        payment_status: "failed",
        payment_failure_code: "condition_adjustment_accepted",
        payment_failure_reason:
          "Condition adjustment accepted. Re-authorize the updated total before pickup.",
        stripe_payment_intent_id: null,
      })
      .eq("id", booking.id);

    if (bookingError) {
      throw new AppError(bookingError.message, 500, "condition_adjustment_booking_update_failed");
    }

    const { data: adjustmentRow, error: updateError } = await supabase
      .from("condition_adjustments")
      .update({
        status: "accepted",
        customer_response_note: responseNote,
        responded_at: respondedAt,
      })
      .eq("id", active.id)
      .select("*")
      .single();

    if (updateError) {
      throw new AppError(updateError.message, 500, "condition_adjustment_accept_failed");
    }

    await recordConditionAdjustmentBookingEvent({
      bookingId: booking.id,
      actorRole: "customer",
      actorUserId: params.userId,
      eventType: "condition_adjustment_accepted",
      metadata: {
        conditionAdjustmentId: active.id,
        amountCents: active.amountCents,
        customerResponseNote: responseNote,
      },
    });

    const participants = await getConditionAdjustmentParticipants({
      customerId: booking.customerId,
      carrierId: booking.carrierId,
    });

    await Promise.all(
      [participants.customerEmail, participants.carrierEmail]
        .filter((email): email is string => Boolean(email))
        .map((email) =>
          sendBookingTransactionalEmail({
            bookingId: booking.id,
            bookingStatus: booking.status,
            emailType: "condition_adjustment_accepted",
            to: email,
            subject: `Booking ${booking.bookingReference}: adjustment accepted`,
            html: buildBookingEmail({
              eyebrow: "Condition adjustment",
              title: "The customer accepted the structured adjustment",
              intro:
                "MoveMate updated the booking total and now needs the updated payment authorization before pickup can continue.",
              bookingReference: booking.bookingReference,
              routeLabel: `${booking.pickupSuburb ?? "Pickup"} to ${booking.dropoffSuburb ?? "Drop-off"}`,
              ctaPath: `/bookings/${booking.id}`,
              ctaLabel: "Open booking",
              bodyLines: [
                `${getConditionAdjustmentReasonLabel(active.reasonCode)} accepted for ${new Intl.NumberFormat("en-AU", {
                  style: "currency",
                  currency: "AUD",
                  maximumFractionDigits: 0,
                }).format(active.amountCents / 100)}.`,
                responseNote ?? "No customer response note was recorded.",
              ],
            }),
          }),
        ),
    );

    return toConditionAdjustment(adjustmentRow as ConditionAdjustmentRow);
  }

  const { data: adjustmentRow, error: rejectError } = await supabase
    .from("condition_adjustments")
    .update({
      status: "rejected",
      customer_response_note: responseNote,
      responded_at: respondedAt,
    })
    .eq("id", active.id)
    .select("*")
    .single();

  if (rejectError) {
    throw new AppError(rejectError.message, 500, "condition_adjustment_reject_failed");
  }

  await recordConditionAdjustmentBookingEvent({
    bookingId: booking.id,
    actorRole: "customer",
    actorUserId: params.userId,
    eventType: "condition_adjustment_rejected",
    metadata: {
      conditionAdjustmentId: active.id,
      amountCents: active.amountCents,
      customerResponseNote: responseNote,
    },
  });

  await updateBookingStatusForActor({
    userId: params.userId,
    bookingId: booking.id,
    nextStatus: "cancelled",
    actorRole: "customer",
    cancellationReason:
      "Customer rejected the one-round condition adjustment after the declared job details materially differed on arrival.",
    cancellationReasonCode: "misdescription",
  });

  const participants = await getConditionAdjustmentParticipants({
    customerId: booking.customerId,
    carrierId: booking.carrierId,
  });

  await Promise.all(
    [participants.customerEmail, participants.carrierEmail]
      .filter((email): email is string => Boolean(email))
      .map((email) =>
        sendBookingTransactionalEmail({
          bookingId: booking.id,
          bookingStatus: "cancelled",
          emailType: "condition_adjustment_rejected",
          to: email,
          subject: `Booking ${booking.bookingReference}: adjustment rejected`,
          html: buildBookingEmail({
            eyebrow: "Condition adjustment",
            title: "The structured adjustment was rejected",
            intro:
              "MoveMate cancelled the booking under the misdescription policy so the issue stays on-platform and auditable.",
            bookingReference: booking.bookingReference,
            routeLabel: `${booking.pickupSuburb ?? "Pickup"} to ${booking.dropoffSuburb ?? "Drop-off"}`,
            ctaPath: `/bookings/${booking.id}`,
            ctaLabel: "Open booking",
            bodyLines: [
              `${getConditionAdjustmentReasonLabel(active.reasonCode)} was rejected by the customer.`,
              responseNote ?? "No customer response note was recorded.",
            ],
          }),
        }),
      ),
  );

  return toConditionAdjustment(adjustmentRow as ConditionAdjustmentRow);
}
