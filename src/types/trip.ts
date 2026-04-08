import type { CarrierProfile, Vehicle } from "@/types/carrier";

export type SpaceSize = "S" | "M" | "L" | "XL";
export type TimeWindow = "morning" | "afternoon" | "evening" | "flexible";
export type ItemCategory =
  | "furniture"
  | "boxes"
  | "appliance"
  | "fragile"
  | "other";

export type ItemSizeCategory = "small" | "medium" | "large";

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
  via: string[];
  label: string;
}

export interface TripRules {
  accepts: ItemCategory[];
  stairsOk: boolean;
  stairsExtraCents: number;
  helperAvailable: boolean;
  helperExtraCents: number;
  specialNotes?: string;
}

export interface TripDraftVehicleOption {
  id: string;
  label: string;
  detail: string;
}

export interface Trip {
  id: string;
  carrier: CarrierProfile;
  vehicle: Vehicle;
  route: TripRoute;
  tripDate: string;
  timeWindow: TimeWindow;
  spaceSize: SpaceSize;
  availableVolumeM3: number;
  availableWeightKg: number;
  detourRadiusKm: number;
  priceCents: number;
  suggestedPriceCents?: number | null;
  dedicatedEstimateCents: number;
  savingsPct: number;
  remainingCapacityPct: number;
  isReturnTrip: boolean;
  status?: "draft" | "active" | "paused" | "booked_partial" | "booked_full" | "expired" | "cancelled";
  publishAt?: string | null;
  rules: TripRules;
}

export interface TripSearchInput {
  from: string;
  to: string;
  when?: string;
  what?: ItemCategory;
  isReturnTrip?: boolean;
  includeNearbyDates?: boolean;
  page?: number;
}

export interface MatchBreakdown {
  routeFit: number;
  destinationFit: number;
  reliability: number;
  priceFit: number;
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
