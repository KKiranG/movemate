import type { BookingPriceBreakdown, MoverPreference, StairsLevel } from "@/types/booking";

const PLATFORM_COMMISSION_RATE = 0.15;
const GST_RATE = 0.1;

function stairsCostForLevel(
  level: StairsLevel,
  liftAvailable: boolean,
  lowCents: number,
  mediumCents: number,
  highCents: number,
): number {
  if (liftAvailable || level === "none") return 0;
  if (level === "low") return lowCents;
  if (level === "medium") return mediumCents;
  return highCents;
}

export function calculateBookingBreakdown(params: {
  basePriceCents: number;
  minimumBasePriceCents?: number;
  adjustmentFeeCents?: number;
  detourAdjustmentCents?: number;
  // Legacy fields — kept for backward compat with existing bookings
  needsStairs?: boolean;
  stairsExtraCents?: number;
  needsHelper?: boolean;
  helperExtraCents?: number;
  secondMoverFeeCents?: number;
  // New handling-policy fields (issue #70)
  carrierHandlingPolicy?: "solo_only" | "solo_customer_help" | "two_movers";
  customerMoverPreference?: MoverPreference;
  stairsLevelPickup?: StairsLevel;
  stairsLevelDropoff?: StairsLevel;
  liftAvailablePickup?: boolean;
  liftAvailableDropoff?: boolean;
  stairsLowCents?: number;
  stairsMediumCents?: number;
  stairsHighCents?: number;
  secondMoverExtraCents?: number;
}): BookingPriceBreakdown {
  if ((params.detourAdjustmentCents ?? 0) > 0) {
    throw new RangeError(
      "Automatic detour pricing is blocked pending an explicit founder decision.",
    );
  }

  const adjustmentFeeCents = Math.max(0, params.adjustmentFeeCents ?? 0);
  const minimumBasePriceCents = Math.max(0, params.minimumBasePriceCents ?? 0);
  const basePriceCents = Math.max(params.basePriceCents, minimumBasePriceCents);

  let stairsFeeCents: number;
  let helperFeeCents: number;
  let secondMoverFeeCents: number;

  const useNewModel =
    params.carrierHandlingPolicy !== undefined ||
    params.customerMoverPreference !== undefined ||
    params.stairsLevelPickup !== undefined;

  if (useNewModel) {
    // New model: second mover fee only when carrier brings 2 AND customer requests 2
    const secondMoverApplies =
      params.carrierHandlingPolicy === "two_movers" &&
      params.customerMoverPreference === "two_movers";
    secondMoverFeeCents = secondMoverApplies ? (params.secondMoverExtraCents ?? 0) : 0;

    // Stairs fee: sum of pickup and dropoff tranche costs, each reduced to 0 if lift available
    const pickupStairs = stairsCostForLevel(
      params.stairsLevelPickup ?? "none",
      params.liftAvailablePickup ?? false,
      params.stairsLowCents ?? 0,
      params.stairsMediumCents ?? 0,
      params.stairsHighCents ?? 0,
    );
    const dropoffStairs = stairsCostForLevel(
      params.stairsLevelDropoff ?? "none",
      params.liftAvailableDropoff ?? false,
      params.stairsLowCents ?? 0,
      params.stairsMediumCents ?? 0,
      params.stairsHighCents ?? 0,
    );
    stairsFeeCents = pickupStairs + dropoffStairs;
    helperFeeCents = 0;
  } else {
    // Legacy model
    stairsFeeCents = (params.needsStairs ?? false) ? (params.stairsExtraCents ?? 0) : 0;
    helperFeeCents = (params.needsHelper ?? false) ? (params.helperExtraCents ?? 0) : 0;
    secondMoverFeeCents = params.secondMoverFeeCents ?? 0;
  }

  const subtotalCents =
    basePriceCents + stairsFeeCents + helperFeeCents + secondMoverFeeCents + adjustmentFeeCents;
  const platformFeeCents = Math.round(basePriceCents * PLATFORM_COMMISSION_RATE);
  const gstCents = Math.round((subtotalCents + platformFeeCents) * GST_RATE);

  return {
    basePriceCents,
    stairsFeeCents,
    helperFeeCents,
    secondMoverFeeCents,
    adjustmentFeeCents,
    platformFeeCents,
    gstCents,
    totalPriceCents: subtotalCents + platformFeeCents + gstCents,
    carrierPayoutCents: subtotalCents,
    platformCommissionCents: platformFeeCents,
    bookingFeeCents: 0,
  };
}
