import type { Booking } from "@/types/booking";

export function getProofSummary(booking: Booking) {
  const pickupState = booking.pickupProofPhotoUrl
    ? "Pickup proof captured"
    : ["picked_up", "in_transit", "delivered", "completed"].includes(booking.status)
      ? "Pickup proof missing"
      : "Pickup proof still needed";

  const deliveryState = booking.deliveryProofPhotoUrl
    ? "Delivery proof captured"
    : ["delivered", "completed"].includes(booking.status)
      ? "Delivery proof missing"
      : "Delivery proof still needed";

  return { pickupState, deliveryState };
}
