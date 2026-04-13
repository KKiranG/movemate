export type VerificationStatus =
  | "pending"
  | "submitted"
  | "verified"
  | "rejected";

export type CarrierActivationStatus =
  | "not_started"
  | "activation_started"
  | "pending_review"
  | "active"
  | "rejected"
  | "suspended";

export type VehicleType =
  | "van"
  | "ute"
  | "small_truck"
  | "large_truck"
  | "trailer";

export interface CarrierProfile {
  id: string;
  userId: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  abn?: string;
  bio?: string;
  licencePhotoUrl?: string | null;
  insurancePhotoUrl?: string | null;
  vehiclePhotoUrl?: string | null;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  activationStatus: CarrierActivationStatus;
  abnVerified: boolean;
  insuranceVerified: boolean;
  verificationSubmittedAt?: string | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  internalNotes?: string | null;
  internalTags?: string[];
  licenceExpiryDate?: string | null;
  insuranceExpiryDate?: string | null;
  averageRating: number;
  ratingCount: number;
  serviceSuburbs: string[];
  stripeAccountId?: string | null;
  stripeOnboardingComplete: boolean;
  onboardingCompletedAt?: string | null;
}

export interface TripTemplate {
  id: string;
  carrierId: string;
  name: string;
  originSuburb: string;
  originPostcode: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationSuburb: string;
  destinationPostcode: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  spaceSize: "S" | "M" | "L" | "XL";
  availableVolumeM3?: number | null;
  maxWeightKg?: number | null;
  detourRadiusKm: number;
  suggestedPriceCents: number;
  stairsOk: boolean;
  stairsExtraCents: number;
  helperExtraCents: number;
  helperAvailable: boolean;
  accepts: string[];
  timeWindow: "morning" | "afternoon" | "evening" | "flexible";
  notes?: string | null;
  isArchived: boolean;
  archivedAt?: string | null;
  timesUsed: number;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripTemplateInput {
  name: string;
  originSuburb: string;
  originPostcode: string;
  originLatitude: number;
  originLongitude: number;
  destinationSuburb: string;
  destinationPostcode: string;
  destinationLatitude: number;
  destinationLongitude: number;
  spaceSize: "S" | "M" | "L" | "XL";
  availableVolumeM3?: number | null;
  maxWeightKg?: number | null;
  detourRadiusKm?: number;
  suggestedPriceCents: number;
  stairsOk?: boolean;
  stairsExtraCents?: number;
  helperExtraCents?: number;
  helperAvailable?: boolean;
  accepts: string[];
  timeWindow?: "morning" | "afternoon" | "evening" | "flexible";
  notes?: string;
}

export interface Vehicle {
  id: string;
  carrierId: string;
  type: VehicleType;
  make?: string;
  model?: string;
  maxVolumeM3: number;
  maxWeightKg: number;
  hasTailgate: boolean;
  hasBlankets: boolean;
  hasStraps: boolean;
  photoUrls: string[];
  regoPlate?: string | null;
  regoState?: string | null;
  isActive: boolean;
}

export interface CarrierDashboardActivityItem {
  id: string;
  type:
    | "trip_posted"
    | "booking_requested"
    | "booking_confirmed"
    | "review_received"
    | "payout_ready";
  title: string;
  description: string;
  occurredAt: string;
  href?: string;
}

export interface CarrierPayoutHold {
  bookingId: string;
  bookingReference: string;
  heldCents: number;
  stage: string;
  missingStep: string;
  explanation: string;
  nextAction: string;
  priority: number;
  ctaHref: string;
  ctaLabel: string;
}

export type CarrierTodayActionUrgency = "urgent" | "watch";

export interface CarrierTodayAction {
  key: string;
  title: string;
  description: string;
  count: number;
  href: string;
  urgency: CarrierTodayActionUrgency;
}

export type CarrierTripHealthTier = "Healthy" | "Watch" | "Risky";

export interface CarrierTripHealth {
  tripId: string;
  routeLabel: string;
  tripDate: string;
  score: number;
  tier: CarrierTripHealthTier;
  reasons: string[];
  href: string;
}

export interface CarrierTodaySnapshot {
  todayActions: CarrierTodayAction[];
  tripHealth: CarrierTripHealth[];
  payoutHolds: CarrierPayoutHold[];
}

export interface CarrierRequestCard {
  id: string;
  moveRequestId: string;
  offerId: string;
  listingId: string;
  bookingId?: string | null;
  requestGroupId?: string | null;
  status: "pending" | "clarification_requested";
  itemDescription: string;
  itemCategory: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupSuburb: string;
  dropoffSuburb: string;
  preferredDate?: string | null;
  requestedTotalPriceCents: number;
  carrierPayoutCents: number;
  responseDeadlineAt: string;
  urgencyLabel?: string | null;
  fitLabel: string;
  fitExplanation: string;
  accessSummary: string;
  photoCount: number;
  photoUrls: string[];
  declineReason?: string | null;
  clarificationReason?: string | null;
  clarificationMessage?: string | null;
  typeLabel: string;
}

export interface RecurringTemplateSuggestion {
  routeLabel: string;
  templateIds: string[];
  templateCount: number;
  nextWeekday: string;
  nextTripDate: string;
}

export interface TemplateInsight {
  templateId: string;
  tripCount: number;
  bookingCount: number;
  completionRatePct: number;
  totalEarningsCents: number;
}
