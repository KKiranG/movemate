import type { BookingPriceBreakdown } from "@/types/booking";

const PLATFORM_COMMISSION_RATE = 0.15;
const GST_RATE = 0.1;

export function calculateBookingBreakdown(params: {
  basePriceCents: number;
  minimumBasePriceCents?: number;
  needsStairs: boolean;
  stairsExtraCents: number;
  needsHelper: boolean;
  helperExtraCents: number;
  adjustmentFeeCents?: number;
  detourAdjustmentCents?: number;
}): BookingPriceBreakdown {
  if ((params.detourAdjustmentCents ?? 0) > 0) {
    throw new RangeError(
      "Automatic detour pricing is blocked pending an explicit founder decision.",
    );
  }

  const stairsFeeCents = params.needsStairs ? params.stairsExtraCents : 0;
  const helperFeeCents = params.needsHelper ? params.helperExtraCents : 0;
  const adjustmentFeeCents = Math.max(0, params.adjustmentFeeCents ?? 0);
  const minimumBasePriceCents = Math.max(0, params.minimumBasePriceCents ?? 0);
  const basePriceCents = Math.max(params.basePriceCents, minimumBasePriceCents);
  const subtotalCents =
    basePriceCents + stairsFeeCents + helperFeeCents + adjustmentFeeCents;
  const platformFeeCents = Math.round(
    basePriceCents * PLATFORM_COMMISSION_RATE,
  );
  const gstCents = Math.round((subtotalCents + platformFeeCents) * GST_RATE);

  return {
    basePriceCents,
    stairsFeeCents,
    helperFeeCents,
    adjustmentFeeCents,
    platformFeeCents,
    gstCents,
    totalPriceCents: subtotalCents + platformFeeCents + gstCents,
    carrierPayoutCents: subtotalCents,
    platformCommissionCents: platformFeeCents,
    bookingFeeCents: 0,
  };
}
