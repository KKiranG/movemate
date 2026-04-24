export type CarrierNudgeType =
  | "pending_booking_expiring"
  | "pickup_proof_stalled"
  | "delivery_proof_stalled"
  | "payout_setup_blocked";

export type CarrierNudgeAuditOutcome = "sent" | "skipped" | "deduped" | "failed";

export interface CarrierNextStepBookingRow {
  id: string;
  booking_reference: string;
  status: string;
  payment_status: string | null;
  pending_expires_at: string | null;
  pickup_proof_photo_url: string | null;
  delivery_proof_photo_url: string | null;
  delivered_at: string | null;
  updated_at: string | null;
  listing_id: string;
  carrier: {
    email?: string | null;
    stripe_onboarding_complete?: boolean | null;
    business_name?: string | null;
  } | null;
  listing: {
    trip_date?: string | null;
    origin_suburb?: string | null;
    destination_suburb?: string | null;
  } | null;
}

export interface CarrierNextStepNudge {
  bookingId: string;
  bookingReference: string;
  bookingStatus: string;
  paymentStatus: string | null;
  listingId: string;
  carrierEmail: string | null;
  routeLabel: string;
  tripDate: string | null;
  type: CarrierNudgeType;
  subject: string;
  headline: string;
  missingStep: string;
  summary: string;
  whatHappensNext: string;
  actionHref: string;
  actionLabel: string;
  dedupeWindowKey: string;
}

export interface CarrierNudgeEmailConfig {
  resendApiKey: string;
  resendFromEmail: string;
  siteUrl: string;
}

function startOfDayIso(value: Date) {
  return value.toISOString().slice(0, 10);
}

function hoursAgoIso(now: Date, hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function isPendingExpiringSoon(row: CarrierNextStepBookingRow, now: Date) {
  if (row.status !== "pending" || !row.pending_expires_at) {
    return false;
  }

  const expiresAt = new Date(row.pending_expires_at).getTime();
  const nowMs = now.getTime();

  return expiresAt > nowMs && expiresAt - nowMs <= 60 * 60 * 1000;
}

function isPickupProofStalled(row: CarrierNextStepBookingRow, todayIso: string) {
  return (
    row.status === "confirmed" &&
    !row.pickup_proof_photo_url &&
    Boolean(row.listing?.trip_date) &&
    row.listing?.trip_date! <= todayIso
  );
}

function isDeliveryProofStalled(row: CarrierNextStepBookingRow, now: Date) {
  if (
    !["picked_up", "in_transit"].includes(row.status) ||
    row.delivery_proof_photo_url ||
    !row.updated_at
  ) {
    return false;
  }

  return row.updated_at <= hoursAgoIso(now, 2);
}

function isPayoutSetupBlocked(row: CarrierNextStepBookingRow) {
  return (
    row.carrier?.stripe_onboarding_complete === false &&
    ["delivered", "completed"].includes(row.status) &&
    !["captured", "refunded", "authorization_cancelled"].includes(
      row.payment_status ?? "pending",
    )
  );
}

function buildRouteLabel(row: CarrierNextStepBookingRow) {
  const origin = row.listing?.origin_suburb ?? "Origin";
  const destination = row.listing?.destination_suburb ?? "Destination";
  return `${origin} -> ${destination}`;
}

function buildActionHref(type: CarrierNudgeType, row: CarrierNextStepBookingRow) {
  if (type === "payout_setup_blocked") {
    return "/carrier/payouts";
  }

  if (type === "pending_booking_expiring") {
    return "/carrier/trips?filter=pending";
  }

  return `/carrier/trips/${row.listing_id}?focus=${row.id}#booking-${row.id}`;
}

function buildActionLabel(type: CarrierNudgeType) {
  switch (type) {
    case "pending_booking_expiring":
      return "Review pending booking";
    case "pickup_proof_stalled":
      return "Add pickup proof";
    case "delivery_proof_stalled":
      return "Add delivery proof";
    case "payout_setup_blocked":
      return "Finish payout setup";
  }
}

function buildNudgeCopy(type: CarrierNudgeType, row: CarrierNextStepBookingRow) {
  switch (type) {
    case "pending_booking_expiring":
      return {
        subject: `Pending booking expires soon: ${row.booking_reference}`,
        headline: "A pending booking is close to expiry",
        missingStep: "Carrier decision still missing",
        summary:
          "A customer is waiting and this booking will expire within the next hour if you do not accept or decline it.",
        whatHappensNext:
          "If it expires, MoveMate cancels the request and releases capacity back to the trip automatically.",
      };
    case "pickup_proof_stalled":
      return {
        subject: `Pickup proof still needed: ${row.booking_reference}`,
        headline: "Pickup proof has not been captured yet",
        missingStep: "Pickup proof pack still missing",
        summary:
          "This booking is confirmed for today or earlier, but pickup proof has not been recorded inside MoveMate.",
        whatHappensNext:
          "Payout stays held and the booking cannot move cleanly through the next operational step until pickup proof is captured.",
      };
    case "delivery_proof_stalled":
      return {
        subject: `Delivery proof still needed: ${row.booking_reference}`,
        headline: "Delivery proof progression looks stuck",
        missingStep: "Delivery proof pack still missing",
        summary:
          "This booking is already picked up or in transit, but delivery proof has not been recorded for more than two hours.",
        whatHappensNext:
          "Keep the handoff trail inside MoveMate so payout and any issue review remain legible if the run goes sideways.",
      };
    case "payout_setup_blocked":
      return {
        subject: `Finish payout setup to release ${row.booking_reference}`,
        headline: "Payout setup is blocking release",
        missingStep: "Stripe payout onboarding still incomplete",
        summary:
          "Money is otherwise moving toward release for this booking, but MoveMate cannot pay out while your payout setup is incomplete.",
        whatHappensNext:
          "Eligible funds remain held until Stripe onboarding is finished, even if proof and customer confirmation are already in place.",
      };
  }
}

function buildDedupeWindowKey(type: CarrierNudgeType, row: CarrierNextStepBookingRow, now: Date) {
  if (type === "pending_booking_expiring") {
    return row.pending_expires_at ?? startOfDayIso(now);
  }

  return startOfDayIso(now);
}

export function selectCarrierNextStepNudges(
  rows: CarrierNextStepBookingRow[],
  now = new Date(),
): CarrierNextStepNudge[] {
  const todayIso = startOfDayIso(now);

  return rows.flatMap((row) => {
    let type: CarrierNudgeType | null = null;

    if (isPendingExpiringSoon(row, now)) {
      type = "pending_booking_expiring";
    } else if (isPickupProofStalled(row, todayIso)) {
      type = "pickup_proof_stalled";
    } else if (isDeliveryProofStalled(row, now)) {
      type = "delivery_proof_stalled";
    } else if (isPayoutSetupBlocked(row)) {
      type = "payout_setup_blocked";
    }

    if (!type) {
      return [];
    }

    const copy = buildNudgeCopy(type, row);

    return [
      {
        bookingId: row.id,
        bookingReference: row.booking_reference,
        bookingStatus: row.status,
        paymentStatus: row.payment_status,
        listingId: row.listing_id,
        carrierEmail: row.carrier?.email ?? null,
        routeLabel: buildRouteLabel(row),
        tripDate: row.listing?.trip_date ?? null,
        type,
        subject: copy.subject,
        headline: copy.headline,
        missingStep: copy.missingStep,
        summary: copy.summary,
        whatHappensNext: copy.whatHappensNext,
        actionHref: buildActionHref(type, row),
        actionLabel: buildActionLabel(type),
        dedupeWindowKey: buildDedupeWindowKey(type, row, now),
      },
    ];
  });
}

export function getCarrierNudgeEmailConfig(env: {
  resendApiKey?: string | null;
  resendFromEmail?: string | null;
  siteUrl?: string | null;
}) {
  if (!env.resendApiKey || !env.resendFromEmail) {
    return { skipped: true as const, reason: "missing_resend" as const };
  }

  return {
    skipped: false as const,
    config: {
      resendApiKey: env.resendApiKey,
      resendFromEmail: env.resendFromEmail,
      siteUrl: env.siteUrl ?? "http://localhost:3000",
    } satisfies CarrierNudgeEmailConfig,
  };
}

export function buildCarrierNudgeAuditEvent(params: {
  nudge: CarrierNextStepNudge;
  outcome: CarrierNudgeAuditOutcome;
  reason?: string | null;
  recipientEmail?: string | null;
  dedupeKey?: string | null;
  providerMessageId?: string | null;
}) {
  return {
    booking_id: params.nudge.bookingId,
    actor_role: "system",
    event_type:
      params.outcome === "sent"
        ? "carrier_next_step_nudge_sent"
        : params.outcome === "failed"
          ? "carrier_next_step_nudge_failed"
          : "carrier_next_step_nudge_skipped",
    metadata: {
      nudgeType: params.nudge.type,
      bookingReference: params.nudge.bookingReference,
      bookingStatus: params.nudge.bookingStatus,
      paymentStatus: params.nudge.paymentStatus,
      routeLabel: params.nudge.routeLabel,
      tripDate: params.nudge.tripDate,
      missingStep: params.nudge.missingStep,
      actionHref: params.nudge.actionHref,
      actionLabel: params.nudge.actionLabel,
      outcome: params.outcome,
      reason: params.reason ?? null,
      recipientEmail: params.recipientEmail ?? null,
      dedupeKey: params.dedupeKey ?? null,
      providerMessageId: params.providerMessageId ?? null,
    },
  };
}
