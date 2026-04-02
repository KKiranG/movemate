import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { ITEM_CATEGORY_LABELS, SPACE_SIZE_LABELS } from "@/lib/constants";
import type { Trip } from "@/types/trip";
import type { CarrierProfile } from "@/types/carrier";
import type { TripSearchResult } from "@/types/trip";

export function getTripCustomerPricePreview(basePriceCents: number) {
  return calculateBookingBreakdown({
    basePriceCents,
    needsStairs: false,
    stairsExtraCents: 0,
    needsHelper: false,
    helperExtraCents: 0,
  });
}

export function getBaseCustomerPriceCents(trip: Pick<Trip, "priceCents"> | number) {
  const basePriceCents = typeof trip === "number" ? trip : trip.priceCents;
  return getTripCustomerPricePreview(basePriceCents).totalPriceCents;
}

export function getTripTimingBadges(
  trip: Pick<Trip, "tripDate" | "timeWindow" | "isReturnTrip">,
) {
  const badges: string[] = [];
  const tripDate = new Date(trip.tripDate);
  const todayIso = new Date().toISOString().slice(0, 10);
  const tripIso = tripDate.toISOString().slice(0, 10);
  const weekday = tripDate.getDay();

  badges.push(trip.timeWindow === "flexible" ? "Flexible timing" : "Fixed pickup window");

  if (tripIso === todayIso) {
    badges.push("Same-day route");
  } else if (weekday === 0 || weekday === 6) {
    badges.push("Weekend run");
  }

  if (trip.isReturnTrip) {
    badges.push("Return trip pricing");
  }

  return badges.slice(0, 3);
}

export function getHumanCapacitySummary(
  trip: Pick<Trip, "spaceSize" | "remainingCapacityPct">,
) {
  if (trip.remainingCapacityPct < 30) {
    if (trip.spaceSize === "S") {
      return "Best for 1-2 boxes or one compact pickup.";
    }

    if (trip.spaceSize === "M") {
      return "Best for one smaller bulky item like a chair, bedside, or compact appliance.";
    }

    return "Best for one bulky item if your dimensions are still close to the listing.";
  }

  if (trip.spaceSize === "S") {
    return "Usually fits 1-2 boxes, lamps, or a compact marketplace pickup.";
  }

  if (trip.spaceSize === "M") {
    return "Usually fits a desk, mattress, washing machine, or 6-8 boxes.";
  }

  if (trip.spaceSize === "L") {
    return "Usually fits a fridge, sofa, or 10-12 boxes.";
  }

  return "Usually fits several bulky pieces or a light studio-style load.";
}

export function getHumanCapacityLabel(
  trip: Pick<Trip, "spaceSize" | "remainingCapacityPct">,
) {
  return getHumanCapacitySummary(trip);
}

export function getTripFitSummary(
  trip: Pick<Trip, "route" | "timeWindow" | "spaceSize" | "rules">,
) {
  const acceptedItems = trip.rules.accepts
    .slice(0, 2)
    .map((item) => ITEM_CATEGORY_LABELS[item].toLowerCase());
  const acceptedLabel =
    acceptedItems.length > 1
      ? `${acceptedItems[0]} or ${acceptedItems[1]}`
      : acceptedItems[0] ?? "awkward-middle items";
  const timing =
    trip.timeWindow === "flexible"
      ? "with flexible timing"
      : `during a ${trip.timeWindow} window`;

  return `Already travelling ${trip.route.originSuburb} to ${trip.route.destinationSuburb} ${timing}, with ${SPACE_SIZE_LABELS[trip.spaceSize].toLowerCase()} spare room for ${acceptedLabel}.`;
}

export function getTripTrustStack(trip: Pick<Trip, "carrier">) {
  const items: string[] = [];

  items.push(trip.carrier.isVerified ? "ID checked" : "Verification pending");
  items.push(
    trip.carrier.ratingCount > 0
      ? `${trip.carrier.averageRating.toFixed(1)}★ from ${trip.carrier.ratingCount} reviews`
      : "New on moverrr",
  );

  if (trip.carrier.stripeOnboardingComplete) {
    items.push("Payout setup ready");
  }

  return items;
}

export function getTripTrustSignals(trip: Pick<Trip, "carrier">) {
  return getTripTrustStack(trip);
}

export function getCarrierTrustBadges(params: {
  carrier: Pick<
    CarrierProfile,
    "isVerified" | "stripeOnboardingComplete" | "verificationStatus"
  >;
  completedJobCount: number;
  proofBackedJobCount: number;
}) {
  const badges: string[] = [];

  if (params.carrier.isVerified) {
    badges.push("ID checked");
  } else if (params.carrier.verificationStatus === "submitted") {
    badges.push("Verification submitted");
  }

  if (params.carrier.stripeOnboardingComplete) {
    badges.push("Payout ready");
  }

  if (params.proofBackedJobCount > 0) {
    badges.push(`${params.proofBackedJobCount} proof-backed jobs`);
  }

  if (params.completedJobCount > 0) {
    badges.push(`${params.completedJobCount} completed jobs`);
  }

  return badges.slice(0, 4);
}

export function getTripQualityScore(
  trip: Pick<TripSearchResult, "carrier" | "matchScore" | "remainingCapacityPct" | "rules">,
) {
  let score = trip.matchScore;

  if (trip.carrier.isVerified) {
    score += 20;
  }

  if (trip.carrier.stripeOnboardingComplete) {
    score += 10;
  }

  if (trip.carrier.ratingCount > 0) {
    score += Math.round(trip.carrier.averageRating * 4);
    score += Math.min(10, trip.carrier.ratingCount);
  }

  if (trip.rules.specialNotes?.trim()) {
    score += 4;
  }

  if (trip.remainingCapacityPct <= 15) {
    score -= 8;
  } else if (trip.remainingCapacityPct >= 40) {
    score += 4;
  }

  return score;
}
