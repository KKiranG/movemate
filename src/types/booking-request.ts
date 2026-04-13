export type BookingRequestStatus =
  | "pending"
  | "clarification_requested"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked"
  | "cancelled";

export type BookingRequestClarificationReason =
  | "item_details"
  | "access_details"
  | "timing"
  | "photos"
  | "other";

export interface BookingRequest {
  id: string;
  moveRequestId: string;
  offerId: string;
  listingId: string;
  customerId: string;
  carrierId: string;
  bookingId?: string | null;
  requestGroupId?: string | null;
  status: BookingRequestStatus;
  requestedTotalPriceCents: number;
  responseDeadlineAt: string;
  clarificationRoundCount?: number | null;
  clarificationReason?: BookingRequestClarificationReason | null;
  clarificationRequestedAt?: string | null;
  clarificationExpiresAt?: string | null;
  clarificationMessage?: string | null;
  customerResponse?: string | null;
  customerResponseAt?: string | null;
  respondedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerBookingRequestCard {
  id: string;
  moveRequestId: string;
  offerId: string;
  listingId: string;
  bookingId?: string | null;
  requestGroupId?: string | null;
  status: BookingRequestStatus;
  itemDescription: string;
  pickupSuburb: string;
  dropoffSuburb: string;
  requestedTotalPriceCents: number;
  responseDeadlineAt: string;
  preferredDate?: string | null;
  carrierBusinessName: string;
  fitExplanation: string;
  typeLabel: string;
  clarificationReason?: BookingRequestClarificationReason | null;
  clarificationMessage?: string | null;
  clarificationRequestedAt?: string | null;
  clarificationExpiresAt?: string | null;
  customerResponse?: string | null;
  customerResponseAt?: string | null;
  recoveryAlertId?: string | null;
  createdAt: string;
}
