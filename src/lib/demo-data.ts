import { filterCandidateTrips } from "@/lib/matching/filter";
import { rankTrips } from "@/lib/matching/rank";
import { getTodayIsoDate } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { CarrierProfile, Vehicle } from "@/types/carrier";
import type { Trip, TripSearchInput } from "@/types/trip";

function getFutureIsoDate(daysFromToday: number) {
  const date = new Date(`${getTodayIsoDate()}T00:00:00`);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split("T")[0] ?? getTodayIsoDate();
}

const carriers: CarrierProfile[] = [
  {
    id: "6b5e5d8b-271c-49f4-b528-3a3e8fdf4497",
    businessName: "Harbour Backloads",
    contactName: "Dave Nolan",
    phone: "+61 400 111 222",
    email: "dave@harbourbackloads.com.au",
    bio: "Independent removalist with spare space between Western Sydney jobs.",
    isVerified: true,
    verificationStatus: "verified",
    stripeOnboardingComplete: true,
    averageRating: 4.8,
    ratingCount: 32,
    serviceSuburbs: ["Penrith", "Parramatta", "Bondi", "Newtown"],
  },
  {
    id: "a7c418d0-c10d-48dd-8a56-4ed2087f17b0",
    businessName: "Metro Van Runs",
    contactName: "Priya Kapoor",
    phone: "+61 400 333 444",
    email: "ops@metrovanruns.com.au",
    bio: "Small van fleet focused on café supplies and business overflow.",
    isVerified: true,
    verificationStatus: "verified",
    stripeOnboardingComplete: true,
    averageRating: 4.7,
    ratingCount: 18,
    serviceSuburbs: ["Wetherill Park", "Newtown", "Alexandria", "Surry Hills"],
  },
  {
    id: "f8221b8a-c65a-4a0d-afc0-e5df1ae44f20",
    businessName: "Student Shift Express",
    contactName: "Tom Hirst",
    phone: "+61 400 555 666",
    email: "hello@studentshift.com.au",
    bio: "Flexible metro runs for share-house and marketplace pickups.",
    isVerified: true,
    verificationStatus: "verified",
    stripeOnboardingComplete: true,
    averageRating: 4.5,
    ratingCount: 10,
    serviceSuburbs: ["Surry Hills", "Parramatta", "Inner West", "Chatswood"],
  },
];

const vehicles: Vehicle[] = [
  {
    id: "3d0aa315-46c6-4429-8a59-390aa3f44304",
    carrierId: carriers[0].id,
    type: "small_truck",
    make: "Isuzu",
    model: "NLR",
    maxVolumeM3: 8,
    maxWeightKg: 1200,
    hasTailgate: false,
    hasBlankets: true,
    hasStraps: true,
    isActive: true,
    photoUrls: [],
  },
  {
    id: "b9db6d0b-f2f6-4c02-aee0-af9f94ddb999",
    carrierId: carriers[1].id,
    type: "van",
    make: "Mercedes-Benz",
    model: "Sprinter",
    maxVolumeM3: 5,
    maxWeightKg: 900,
    hasTailgate: false,
    hasBlankets: true,
    hasStraps: true,
    isActive: true,
    photoUrls: [],
  },
  {
    id: "f88bdc7c-05e7-4e2b-8e32-54e2cf2ca30a",
    carrierId: carriers[2].id,
    type: "ute",
    make: "Toyota",
    model: "Hilux",
    maxVolumeM3: 3,
    maxWeightKg: 700,
    hasTailgate: false,
    hasBlankets: false,
    hasStraps: true,
    isActive: true,
    photoUrls: [],
  },
];

export const demoTrips: Trip[] = [
  {
    id: "708d7443-d9d0-46d5-a19b-e7cf6e6723c9",
    carrier: carriers[0],
    vehicle: vehicles[0],
    route: {
      originSuburb: "Penrith",
      destinationSuburb: "Bondi",
      via: ["Parramatta", "Strathfield"],
      label: "Penrith → Bondi",
    },
    tripDate: getFutureIsoDate(1),
    timeWindow: "afternoon",
    spaceSize: "L",
    availableVolumeM3: 2.5,
    availableWeightKg: 250,
    detourRadiusKm: 15,
    priceCents: 8500,
    dedicatedEstimateCents: 18000,
    savingsPct: 53,
    remainingCapacityPct: 60,
    isReturnTrip: false,
    rules: {
      accepts: ["furniture", "boxes", "appliance"],
      stairsOk: true,
      stairsExtraCents: 2000,
      helperAvailable: true,
      helperExtraCents: 3000,
      specialNotes: "Best for marketplace pickups and single bulky items.",
    },
  },
  {
    id: "4bbf7bf4-f84b-41dc-b967-6cd64ddf133f",
    carrier: carriers[1],
    vehicle: vehicles[1],
    route: {
      originSuburb: "Wetherill Park",
      destinationSuburb: "Newtown",
      via: ["Alexandria"],
      label: "Wetherill Park → Newtown",
    },
    tripDate: getFutureIsoDate(2),
    timeWindow: "morning",
    spaceSize: "M",
    availableVolumeM3: 1.1,
    availableWeightKg: 120,
    detourRadiusKm: 12,
    priceCents: 6200,
    dedicatedEstimateCents: 14500,
    savingsPct: 57,
    remainingCapacityPct: 75,
    isReturnTrip: false,
    rules: {
      accepts: ["boxes", "appliance", "fragile", "other"],
      stairsOk: false,
      stairsExtraCents: 0,
      helperAvailable: false,
      helperExtraCents: 0,
      specialNotes: "Warehouse and café-friendly van run.",
    },
  },
  {
    id: "f2d30152-6232-4b7a-a7ca-6930c51ba8cb",
    carrier: carriers[2],
    vehicle: vehicles[2],
    route: {
      originSuburb: "Surry Hills",
      destinationSuburb: "Parramatta",
      via: ["Newtown", "Lidcombe"],
      label: "Surry Hills → Parramatta",
    },
    tripDate: getFutureIsoDate(3),
    timeWindow: "evening",
    spaceSize: "M",
    availableVolumeM3: 1,
    availableWeightKg: 100,
    detourRadiusKm: 10,
    priceCents: 7000,
    dedicatedEstimateCents: 16000,
    savingsPct: 56,
    remainingCapacityPct: 80,
    isReturnTrip: false,
    rules: {
      accepts: ["furniture", "boxes", "other"],
      stairsOk: true,
      stairsExtraCents: 1500,
      helperAvailable: false,
      helperExtraCents: 0,
      specialNotes: "Good fit for student moves and share-house overflow.",
    },
  },
];

export const demoBookings: Booking[] = [
  {
    id: "8d0ad4b8-20b9-4e35-86c8-f82c9099c67b",
    bookingReference: "MVR-2026-0421",
    listingId: demoTrips[0].id,
    carrierId: demoTrips[0].carrier.id,
    customerId: "7fa95af6-8d7f-4b9f-830a-4066c5d75e87",
    itemDescription: "Three-seat sofa",
    itemCategory: "furniture",
    pickupAddress: "Penrith NSW 2750",
    dropoffAddress: "Bondi NSW 2026",
    itemPhotoUrls: [],
    needsStairs: false,
    needsHelper: false,
    status: "confirmed",
    pricing: {
      basePriceCents: 8500,
      stairsFeeCents: 0,
      helperFeeCents: 0,
      bookingFeeCents: 500,
      totalPriceCents: 9000,
      carrierPayoutCents: 7225,
      platformCommissionCents: 1275,
    },
  },
];

export function findTripById(id: string) {
  return demoTrips.find((trip) => trip.id === id) ?? null;
}

export function searchDemoTrips(input: TripSearchInput) {
  const filtered = filterCandidateTrips(demoTrips, input.what);

  return rankTrips({
    trips: filtered,
    from: input.from,
    to: input.to,
    category: input.what,
  }).filter((trip) => !input.when || trip.tripDate === input.when);
}
