import type {
  BookingItemSizeClass,
  BookingItemWeightBand,
  BookingPriceBreakdown,
} from "@/types/booking";
import type { ItemCategory, TimeWindow } from "@/types/trip";

export type MoveRequestStatus =
  | "draft"
  | "submitted"
  | "matched"
  | "booking_requested"
  | "booked"
  | "expired"
  | "cancelled";

export type OfferStatus = "active" | "selected" | "expired" | "rejected";

export type OfferMatchClass =
  | "direct"
  | "near_pickup"
  | "near_dropoff"
  | "nearby_date"
  | "partial_route"
  | "needs_approval";

export type OfferFitConfidence =
  | "likely_fits"
  | "review_photos"
  | "needs_approval";

export interface MoveRequestRoute {
  pickupAddress: string;
  pickupSuburb: string;
  pickupPostcode: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAccessNotes?: string | null;
  dropoffAddress: string;
  dropoffSuburb: string;
  dropoffPostcode: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  dropoffAccessNotes?: string | null;
  preferredDate?: string | null;
  preferredTimeWindow?: TimeWindow | null;
}

export interface MoveRequestItem {
  description: string;
  category: ItemCategory;
  sizeClass?: BookingItemSizeClass | null;
  weightBand?: BookingItemWeightBand | null;
  dimensions?: string | null;
  weightKg?: number | null;
  photoUrls: string[];
}

export interface MoveRequest {
  id: string;
  customerId: string;
  status: MoveRequestStatus;
  item: MoveRequestItem;
  route: MoveRequestRoute;
  needsStairs: boolean;
  needsHelper: boolean;
  customerMoverPreference: "one_mover" | "customer_help" | "two_movers";
  stairsLevelPickup: "none" | "low" | "medium" | "high";
  stairsLevelDropoff: "none" | "low" | "medium" | "high";
  liftAvailablePickup: boolean;
  liftAvailableDropoff: boolean;
  specialInstructions?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  moveRequestId: string;
  listingId: string;
  carrierId: string;
  status: OfferStatus;
  matchClass: OfferMatchClass;
  fitConfidence: OfferFitConfidence;
  matchExplanation: string;
  rankingScore: number;
  pickupDistanceKm?: number | null;
  dropoffDistanceKm?: number | null;
  detourDistanceKm?: number | null;
  pricing: BookingPriceBreakdown;
  expiresAt?: string | null;
  createdAt: string;
}
