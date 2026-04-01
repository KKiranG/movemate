import {
  BOOKING_PAYMENT_LABELS,
  BOOKING_CANCELLATION_REASONS,
  PENDING_BOOKING_HOLD_MS,
} from "@/lib/constants";
import type {
  Booking,
  BookingCancellationReasonCode,
  BookingPaymentStatus,
} from "@/types/booking";

export function getCancellationReasonLabel(
  code: BookingCancellationReasonCode | null | undefined,
) {
  return (
    BOOKING_CANCELLATION_REASONS.find((reason) => reason.value === code)?.label ?? "Cancelled"
  );
}

export function getPendingExpiryTimestamp(booking: Booking) {
  if (booking.pendingExpiresAt) {
    return booking.pendingExpiresAt;
  }

  if (!booking.createdAt) {
    return null;
  }

  return new Date(new Date(booking.createdAt).getTime() + PENDING_BOOKING_HOLD_MS).toISOString();
}

export function getBookingPaymentStateSummary(booking: Booking) {
  const paymentStatus: BookingPaymentStatus = booking.paymentStatus ?? "pending";

  if (paymentStatus === "failed") {
    return {
      badge: BOOKING_PAYMENT_LABELS.failed,
      tone: "error" as const,
      title: "Payment needs another card or retry",
      description:
        booking.paymentFailureReason ??
        "The first authorization did not go through. Your booking is still saved and can be retried.",
      retryable: true,
    };
  }

  if (paymentStatus === "authorization_cancelled") {
    return {
      badge: BOOKING_PAYMENT_LABELS.authorization_cancelled,
      tone: "warning" as const,
      title: "The card hold was released",
      description:
        "No charge was captured. If you still want this trip, restart payment setup from this booking.",
      retryable: booking.status === "pending",
    };
  }

  if (paymentStatus === "authorized") {
    return {
      badge: BOOKING_PAYMENT_LABELS.authorized,
      tone: "success" as const,
      title: "Your card has been authorized",
      description:
        "Funds are reserved only. The booking is not fully charged until the job is completed.",
      retryable: false,
    };
  }

  if (paymentStatus === "captured") {
    return {
      badge: BOOKING_PAYMENT_LABELS.captured,
      tone: "success" as const,
      title: "Payment captured",
      description: "The completed booking charge has been finalized.",
      retryable: false,
    };
  }

  if (paymentStatus === "refunded") {
    return {
      badge: BOOKING_PAYMENT_LABELS.refunded,
      tone: "neutral" as const,
      title: "Payment refunded",
      description: "Money was captured and then returned to the original payment method.",
      retryable: false,
    };
  }

  return {
    badge: BOOKING_PAYMENT_LABELS.pending,
    tone: "neutral" as const,
    title: "Payment still pending",
    description:
      "Stripe has not confirmed the authorization yet. Keep this page open or retry payment setup if needed.",
    retryable: booking.status === "pending",
  };
}

export function getConfirmedBookingChecklist() {
  return [
    "Have the item packed, wrapped, or ready to move before the time window starts.",
    "Make sure someone is available at the pickup address during the posted window.",
    "Keep building access details, gate codes, and loading instructions handy.",
    "Have ID or proof-of-ownership available if the carrier needs a handoff photo.",
  ];
}
