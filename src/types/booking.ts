import type { ItemCategory } from "@/types/trip";

export type BookingItemSizeClass = "S" | "M" | "L" | "XL";
export type BookingItemWeightBand =
  | "under_20kg"
  | "20_to_50kg"
  | "50_to_100kg"
  | "over_100kg";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export interface BookingPriceBreakdown {
  basePriceCents: number;
  stairsFeeCents: number;
  helperFeeCents: number;
  adjustmentFeeCents: number;
  platformFeeCents: number;
  gstCents: number;
  totalPriceCents: number;
  carrierPayoutCents: number;
  platformCommissionCents: number;
  bookingFeeCents?: number;
}

export type BookingPaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "capture_failed"
  | "refunded"
  | "failed"
  | "authorization_cancelled";

export type BookingPaymentLifecyclePhase =
  | "authorization_pending"
  | "funds_held"
  | "release_pending"
  | "paid"
  | "manual_review"
  | "refunded"
  | "authorization_failed"
  | "hold_released";

export type BookingCancellationReasonCode =
  | "carrier_unavailable"
  | "customer_changed_plans"
  | "payment_failed"
  | "no_response"
  | "safety_concern"
  | "misdescription";

export type BookingFlowSource = "legacy_booking" | "booking_request";

export type BookingFlowCompatibility =
  | {
      source: "legacy_booking";
      listingId: string;
      moveRequestId?: string | null;
      offerId?: string | null;
      bookingRequestId?: string | null;
      requestGroupId?: string | null;
    }
  | {
      source: "booking_request";
      listingId: string;
      moveRequestId?: string | null;
      offerId?: string | null;
      bookingRequestId?: string | null;
      requestGroupId?: string | null;
    };

export type BookingProofCondition =
  | "no_visible_damage"
  | "wear_noted"
  | "damage_noted";

export type BookingExceptionCode =
  | "none"
  | "damage"
  | "no_show"
  | "late"
  | "wrong_item"
  | "overcharge"
  | "other";

export interface BookingPickupProof {
  photoUrl: string;
  itemCount: number;
  condition: BookingProofCondition;
  handoffConfirmed: boolean;
  capturedAt: string;
  latitude: number;
  longitude: number;
}

export interface BookingDeliveryProof {
  photoUrl: string;
  recipientConfirmed: boolean;
  exceptionCode?: BookingExceptionCode;
  exceptionNote?: string;
  capturedAt: string;
  latitude: number;
  longitude: number;
}

export interface BookingExceptionReport {
  code: Exclude<BookingExceptionCode, "none">;
  note: string;
  photoUrls: string[];
}

export interface BookingEvent {
  id: string;
  bookingId: string;
  eventType: string;
  actorRole: string;
  actorUserId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  listingId: string;
  flow: BookingFlowCompatibility;
  carrierId: string;
  customerId: string;
  carrierBusinessName?: string;
  itemDescription: string;
  itemCategory: ItemCategory;
  itemSizeClass?: BookingItemSizeClass | null;
  itemWeightBand?: BookingItemWeightBand | null;
  itemDimensions?: string | null;
  itemWeightKg?: number | null;
  itemPhotoUrls: string[];
  pickupAddress: string;
  pickupSuburb?: string;
  pickupPostcode?: string;
  dropoffAddress: string;
  dropoffSuburb?: string;
  dropoffPostcode?: string;
  pickupAccessNotes?: string | null;
  dropoffAccessNotes?: string | null;
  needsStairs: boolean;
  needsHelper: boolean;
  status: BookingStatus;
  pricing: BookingPriceBreakdown;
  paymentStatus?: BookingPaymentStatus;
  paymentFailureCode?: string | null;
  paymentFailureReason?: string | null;
  stripePaymentIntentId?: string | null;
  pickupProofPhotoUrl?: string | null;
  deliveryProofPhotoUrl?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  customerConfirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancellationReasonCode?: BookingCancellationReasonCode | null;
  pendingExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  events?: BookingEvent[];
}
