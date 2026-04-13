import type { BookingStatus } from "@/types/booking";
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
  pending: ["clarification_requested", "accepted", "declined", "expired", "cancelled", "revoked"],
  clarification_requested: ["pending", "accepted", "declined", "cancelled", "expired", "revoked"],
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
