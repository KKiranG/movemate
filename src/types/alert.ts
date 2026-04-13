import type { ItemCategory } from "@/types/trip";

export type UnmatchedRequestStatus =
  | "active"
  | "notified"
  | "matched"
  | "expired"
  | "cancelled";

export interface UnmatchedRequest {
  id: string;
  customerId?: string | null;
  moveRequestId?: string | null;
  status: UnmatchedRequestStatus;
  pickupSuburb: string;
  pickupPostcode?: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffSuburb: string;
  dropoffPostcode?: string | null;
  dropoffLatitude: number;
  dropoffLongitude: number;
  itemCategory?: ItemCategory | null;
  itemDescription: string;
  preferredDate?: string | null;
  notifyEmail?: string | null;
  lastNotifiedAt?: string | null;
  notificationCount: number;
  matchedAt?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerConciergeOffer {
  id: string;
  unmatchedRequestId: string;
  moveRequestId?: string | null;
  listingId?: string | null;
  offerId?: string | null;
  bookingRequestId?: string | null;
  carrierId: string;
  carrierBusinessName: string;
  quotedTotalPriceCents: number;
  status: "draft" | "sent" | "accepted" | "declined" | "cancelled";
  note?: string | null;
  tripDate?: string | null;
  timeWindow?: string | null;
  sentAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
