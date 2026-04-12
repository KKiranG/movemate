"use client";

import { Card } from "@/components/ui/card";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { formatCurrency } from "@/lib/utils";

interface PriceBreakdownProps {
  basePriceCents: number;
  needsStairs: boolean;
  stairsExtraCents: number;
  needsHelper: boolean;
  helperExtraCents: number;
  dedicatedEstimateCents?: number;
}

export function PriceBreakdown({
  basePriceCents,
  needsStairs,
  stairsExtraCents,
  needsHelper,
  helperExtraCents,
  dedicatedEstimateCents,
}: PriceBreakdownProps) {
  const pricing = calculateBookingBreakdown({
    basePriceCents,
    needsStairs,
    stairsExtraCents,
    needsHelper,
    helperExtraCents,
  });
  const savings = dedicatedEstimateCents
    ? Math.max(0, dedicatedEstimateCents - pricing.totalPriceCents)
    : null;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <p className="section-label">Full moverrr breakdown</p>
          <h2 className="mt-1 text-lg text-text">
            Transparent before you send the request
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Customer total = carrier route price + selected add-ons + moverrr
            charges.
          </p>
        </div>
        <dl className="space-y-2 text-sm text-text-secondary">
          <div className="flex items-center justify-between gap-4">
            <dt>
              <span className="text-text">Carrier route price</span>
              <span className="mt-1 block text-xs text-text-secondary">
                The spare-capacity rate for the trip itself.
              </span>
            </dt>
            <dd className="text-text">
              {formatCurrency(pricing.basePriceCents)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>
              <span className="text-text">Stairs add-on</span>
              <span className="mt-1 block text-xs text-text-secondary">
                Only charged if you confirm stair access is needed.
              </span>
            </dt>
            <dd className="text-text">
              {formatCurrency(pricing.stairsFeeCents)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>
              <span className="text-text">Helper add-on</span>
              <span className="mt-1 block text-xs text-text-secondary">
                Optional extra pair of hands when the carrier offers it.
              </span>
            </dt>
            <dd className="text-text">
              {formatCurrency(pricing.helperFeeCents)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>
              <span className="text-text">moverrr charges</span>
              <span className="mt-1 block text-xs text-text-secondary">
                Covers secure payment handling, support, and proof capture.
              </span>
            </dt>
            <dd className="text-text">
              {formatCurrency(pricing.bookingFeeCents)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
            <dt className="font-medium text-text">Customer total</dt>
            <dd className="text-base font-medium text-text">
              {formatCurrency(pricing.totalPriceCents)}
            </dd>
          </div>
        </dl>
        {savings && savings > 0 ? (
          <p className="rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success">
            Dedicated estimate {formatCurrency(dedicatedEstimateCents ?? 0)}.
            You save {formatCurrency(savings)} on this route-fit booking.
          </p>
        ) : null}
        <p className="text-xs text-text-secondary">
          moverrr commission comes from the base price only, never from stairs
          or helper add-ons.
        </p>
        {!needsStairs && stairsExtraCents > 0 ? (
          <p className="text-sm text-text-secondary">
            Available: stairs support ({formatCurrency(stairsExtraCents)}).
          </p>
        ) : null}
        {!needsHelper && helperExtraCents > 0 ? (
          <p className="text-sm text-text-secondary">
            Available: helper ({formatCurrency(helperExtraCents)}).
          </p>
        ) : null}
      </div>
    </Card>
  );
}
