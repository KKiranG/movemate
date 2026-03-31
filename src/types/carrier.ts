export type VerificationStatus =
  | "pending"
  | "submitted"
  | "verified"
  | "rejected";

export type VehicleType =
  | "van"
  | "ute"
  | "small_truck"
  | "large_truck"
  | "trailer";

export interface CarrierProfile {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  abn?: string;
  bio?: string;
  licencePhotoUrl?: string | null;
  insurancePhotoUrl?: string | null;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationSubmittedAt?: string | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
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
