import type {
  BookingPaymentLifecyclePhase,
  BookingPaymentStatus,
  BookingStatus,
} from "@/types/booking";
import type { BookingRequestStatus } from "@/types/booking-request";

export const ALLOWED_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["picked_up", "cancelled"],
  picked_up: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["completed", "disputed"],
  completed: ["disputed"],
  cancelled: [],
  disputed: ["completed", "cancelled"],
};

export function canTransitionBooking(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
) {
  return ALLOWED_BOOKING_TRANSITIONS[currentStatus].includes(nextStatus);
}

export const ALLOWED_BOOKING_REQUEST_TRANSITIONS: Record<
  BookingRequestStatus,
  BookingRequestStatus[]
> = {
  pending: ["clarification_requested", "accepting", "declined", "expired", "cancelled", "revoked"],
  clarification_requested: ["pending", "accepting", "declined", "cancelled", "expired", "revoked"],
  accepting: ["pending", "clarification_requested", "accepted", "revoked"],
  accepted: [],
  declined: [],
  expired: [],
  revoked: [],
  cancelled: [],
};

export function canTransitionBookingRequest(
  currentStatus: BookingRequestStatus,
  nextStatus: BookingRequestStatus,
) {
  return ALLOWED_BOOKING_REQUEST_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function getBookingPaymentLifecyclePhase(params: {
  bookingStatus: BookingStatus;
  paymentStatus?: BookingPaymentStatus | null;
}): BookingPaymentLifecyclePhase {
  const paymentStatus = params.paymentStatus ?? "pending";

  if (paymentStatus === "failed") {
    return "authorization_failed";
  }

  if (paymentStatus === "authorization_cancelled") {
    return "hold_released";
  }

  if (paymentStatus === "capture_failed") {
    return "manual_review";
  }

  if (paymentStatus === "refunded") {
    return "refunded";
  }

  if (paymentStatus === "captured") {
    return "paid";
  }

  if (paymentStatus === "authorized") {
    if (["delivered", "completed", "disputed"].includes(params.bookingStatus)) {
      return "release_pending";
    }

    return "funds_held";
  }

  return "authorization_pending";
}
