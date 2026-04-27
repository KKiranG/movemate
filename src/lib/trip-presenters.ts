import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { ITEM_CATEGORY_LABELS, SPACE_SIZE_LABELS } from "@/lib/constants";
import type { OfferFitConfidence } from "@/types/move-request";
import type { Trip } from "@/types/trip";
import type { CarrierProfile } from "@/types/carrier";
import type { TripSearchResult } from "@/types/trip";

function getDayOffset(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export function getTripCustomerPricePreview(
  basePriceCents: number,
  minimumBasePriceCents = 0,
) {
  return calculateBookingBreakdown({
    basePriceCents,
    minimumBasePriceCents,
    needsStairs: false,
    stairsExtraCents: 0,
    needsHelper: false,
    helperExtraCents: 0,
  });
}

export function getBaseCustomerPriceCents(
  trip: Pick<Trip, "priceCents" | "minimumBasePriceCents"> | number,
) {
  const basePriceCents = typeof trip === "number" ? trip : trip.priceCents;
  const minimumBasePriceCents = typeof trip === "number" ? 0 : trip.minimumBasePriceCents;
  return getTripCustomerPricePreview(basePriceCents, minimumBasePriceCents).totalPriceCents;
}

export function getTripAllInPriceSummary(basePriceCents: number, minimumBasePriceCents = 0) {
  const preview = getTripCustomerPricePreview(basePriceCents, minimumBasePriceCents);

  return {
    totalPriceCents: preview.totalPriceCents,
    platformFeeCents: preview.platformFeeCents,
    gstCents: preview.gstCents,
  };
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

export function getTripFitNoteFromConfidence(fitConfidence: OfferFitConfidence): string | null {
  if (fitConfidence === "likely_fits") return null;
  if (fitConfidence === "review_photos") {
    return "Share a photo of your item so the carrier can confirm the fit before locking it in.";
  }
  return "The carrier will take a look at the details and confirm the fit — usually fast.";
}

export function getTripFitConfidenceLabel(matchScore?: number | null) {
  if (typeof matchScore !== "number") {
    return "Likely fits";
  }

  if (matchScore >= 70) {
    return "Likely fits";
  }

  if (matchScore >= 50) {
    return "Review photos";
  }

  return "Needs approval";
}

export function getTripNearbyDateExplanation(params: {
  preferredDate?: string | null;
  tripDate: string;
}) {
  if (!params.preferredDate || params.preferredDate === params.tripDate) {
    return null;
  }

  const offset = getDayOffset(params.preferredDate, params.tripDate);

  if (offset === 0) {
    return null;
  }

  const absoluteDays = Math.abs(offset);
  const unit = absoluteDays === 1 ? "day" : "days";

  return offset > 0
    ? `${absoluteDays} ${unit} after your preferred date`
    : `${absoluteDays} ${unit} before your preferred date`;
}

export function getTripFitReviewExplanation(
  trip: Pick<Trip, "rules" | "spaceSize"> | Pick<TripSearchResult, "breakdown" | "matchScore" | "rules" | "spaceSize">,
) {
  if (!("breakdown" in trip) || typeof trip.matchScore !== "number") {
    return null;
  }

  if (trip.matchScore >= 70) {
    return null;
  }

  const pickupDistanceKm = trip.breakdown.pickupDistanceKm ?? 0;
  const dropoffDistanceKm = trip.breakdown.dropoffDistanceKm ?? 0;
  const farthestDistanceKm = Math.max(pickupDistanceKm, dropoffDistanceKm);

  if (trip.matchScore >= 50) {
    if (farthestDistanceKm > 2) {
      return "One end of the handoff is a short detour from the main route — send your photos and the carrier will confirm.";
    }

    if (trip.spaceSize === "S" || trip.spaceSize === "M") {
      return "Space is on the snug side — share a photo of your item so the carrier can confirm it fits.";
    }

    return "Share a photo of your item so the carrier can confirm the fit before locking it in.";
  }

  if (!trip.rules.stairsOk || !trip.rules.helperAvailable) {
    return "This one needs a quick check from the carrier on handling before they can confirm.";
  }

  return "The carrier will take a look at the details and confirm the fit — usually fast.";
}

export function getTripRouteFitLabel(
  trip:
    | Pick<Trip, "route">
    | Pick<TripSearchResult, "route" | "breakdown" | "matchScore">,
) {
  if (!("breakdown" in trip)) {
    return "Going your way";
  }

  const pickupDistanceKm = trip.breakdown.pickupDistanceKm ?? null;
  const dropoffDistanceKm = trip.breakdown.dropoffDistanceKm ?? null;

  if (typeof pickupDistanceKm !== "number" || typeof dropoffDistanceKm !== "number") {
    return "Going your way";
  }

  if (trip.matchScore < 50) {
    return "May need carrier approval";
  }

  if (pickupDistanceKm <= 2 && dropoffDistanceKm <= 2) {
    return "Going your way";
  }

  if (pickupDistanceKm > 2 && dropoffDistanceKm <= 2) {
    return "Close to your pickup";
  }

  if (pickupDistanceKm <= 2 && dropoffDistanceKm > 2) {
    return "Close to your drop-off";
  }

  return "Nearby route match";
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
    trip.carrier.ratingCount >= 3
      ? `${trip.carrier.averageRating.toFixed(1)}★ from ${trip.carrier.ratingCount} reviews`
      : "New to MoveMate",
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
