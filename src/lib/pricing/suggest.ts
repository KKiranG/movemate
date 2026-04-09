import { applyTripBasePriceFloor } from "@/lib/pricing/guardrails";
import type { SpaceSize } from "@/types/trip";

export function suggestPrice(params: {
  distanceKm: number;
  spaceSize: SpaceSize;
  needsStairs: boolean;
  needsHelper: boolean;
  isReturn: boolean;
}) {
  const baseRates = {
    S: { perKm: 150, minimum: 4000 },
    M: { perKm: 200, minimum: 6000 },
    L: { perKm: 300, minimum: 8000 },
    XL: { perKm: 450, minimum: 12000 },
  } as const;

  const rate = baseRates[params.spaceSize];
  let baseCents = Math.max(rate.minimum, params.distanceKm * rate.perKm);

  if (params.isReturn) {
    baseCents *= 0.6;
  }

  baseCents = applyTripBasePriceFloor(Math.round(baseCents), params.distanceKm);

  const stairsSurcharge = params.needsStairs ? 2000 : 0;
  const helperSurcharge = params.needsHelper ? 3000 : 0;
  const total = baseCents + stairsSurcharge + helperSurcharge;

  return {
    lowCents: Math.round(total * 0.7),
    midCents: Math.round(total),
    highCents: Math.round(total * 1.4),
  };
}
