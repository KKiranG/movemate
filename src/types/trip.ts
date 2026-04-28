import type { CarrierProfile, Vehicle } from "@/types/carrier";

export type SpaceSize = "S" | "M" | "L" | "XL";
export type TimeWindow = "morning" | "afternoon" | "evening" | "flexible";
export type ItemCategory =
  | "furniture"
  | "boxes"
  | "appliance"
  | "fragile"
  | "other";

export type ItemSizeCategory = "S" | "M" | "L" | "XL";

export type TripFlowSource = "legacy_listing" | "offer";

export type TripDetourTolerance = "tight" | "standard" | "flexible";

export interface TripWaypoint {
  suburb: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
}

export interface TripRecurrence {
  rule?: string | null;
  days: string[];
}

export interface TripFlowCompatibility {
  source: TripFlowSource;
  listingId: string;
  moveRequestId?: string | null;
  offerId?: string | null;
}

export interface TripRoute {
  originSuburb: string;
  originPostcode?: string;
  originAddress?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationSuburb: string;
  destinationPostcode?: string;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  waypoints: TripWaypoint[];
  via: string[];
  polyline?: string | null;
  label: string;
}

export type HandlingPolicy = "solo_only" | "solo_customer_help" | "two_movers";

export interface TripRules {
  accepts: ItemCategory[];
  stairsOk: boolean;
  stairsExtraCents: number;
  helperAvailable: boolean;
  helperExtraCents: number;
  handlingPolicy: HandlingPolicy;
  stairsLowCents: number;
  stairsMediumCents: number;
  stairsHighCents: number;
  secondMoverExtraCents: number;
  specialNotes?: string;
}

export interface TripDraftVehicleOption {
  id: string;
  label: string;
  detail: string;
}

export interface Trip {
  id: string;
  flow: TripFlowCompatibility;
  carrier: CarrierProfile;
  vehicle: Vehicle;
  route: TripRoute;
  tripDate: string;
  timeWindow: TimeWindow;
  spaceSize: SpaceSize;
  availableVolumeM3: number;
  availableWeightKg: number;
  detourRadiusKm: number;
  detourTolerance: TripDetourTolerance;
  priceCents: number;
  minimumBasePriceCents: number;
  suggestedPriceCents?: number | null;
  dedicatedEstimateCents: number;
  savingsPct: number;
  remainingCapacityPct: number;
  isReturnTrip: boolean;
  status?: "draft" | "active" | "paused" | "booked_partial" | "booked_full" | "expired" | "cancelled" | "suspended";
  checkin24hConfirmed?: boolean;
  checkin24hRequestedAt?: string | null;
  checkin2hConfirmed?: boolean;
  checkin2hRequestedAt?: string | null;
  freshnessSuspendedAt?: string | null;
  freshnessMissCount?: number;
  freshnessLastAction?:
    | "none"
    | "requested_24h"
    | "confirmed_24h"
    | "requested_2h"
    | "confirmed_2h"
    | "suspended"
    | "unsuspended";
  freshnessSuspensionReason?: "missed_2h_checkin" | "manual_ops" | "other" | null;
  lastFreshnessConfirmedAt?: string | null;
  lastFreshnessUnsuspendedAt?: string | null;
  publishAt?: string | null;
  recurrence?: TripRecurrence;
  rules: TripRules;
}

export interface TripSearchInput {
  from: string;
  to: string;
  when?: string;
  dates?: string[];
  what?: ItemCategory;
  isReturnTrip?: boolean;
  includeNearbyDates?: boolean;
  flexibleDates?: boolean;
  page?: number;
}

export interface MatchBreakdown {
  routeFit: number;
  destinationFit: number;
  reliability: number;
  priceFit: number;
  pickupDistanceKm?: number;
  dropoffDistanceKm?: number;
}

export interface TripSearchResult extends Trip {
  matchScore: number;
  breakdown: MatchBreakdown;
}

export interface RoutePriceGuidance {
  exampleCount: number;
  lowCents: number;
  highCents: number;
  medianCents: number;
  usedFallback: boolean;
  explanation: string;
}

export interface TripSearchResponse {
  results: TripSearchResult[];
  totalCount: number;
  visibleCount: number;
  page: number;
  hasMore: boolean;
  geocodingAvailable: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string | null;
  nearbyDateOptions: string[];
}
