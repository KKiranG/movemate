"use client";

import { useState } from "react";

import { BookingForm } from "@/components/booking/booking-form";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { Card } from "@/components/ui/card";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { formatCurrency } from "@/lib/utils";
import type { Trip } from "@/types/trip";

export function BookingCheckoutPanel({
  trip,
  isAuthenticated,
}: {
  trip: Trip;
  isAuthenticated: boolean;
}) {
  const [needsStairs, setNeedsStairs] = useState(false);
  const [needsHelper, setNeedsHelper] = useState(false);

  const pricing = calculateBookingBreakdown({
    basePriceCents: trip.priceCents,
    needsStairs,
    stairsExtraCents: trip.rules.stairsExtraCents,
    needsHelper,
    helperExtraCents: trip.rules.helperExtraCents,
  });
  const savingsCents = Math.max(0, trip.dedicatedEstimateCents - pricing.totalPriceCents);

  return (
    <div className="space-y-4">
      <div>
        <p className="section-label">Booking form</p>
        <h2 className="mt-1 text-lg text-text">Item and address details</h2>
      </div>
      <Card className="border-success/20 bg-success/5 p-4">
        <p className="section-label">Savings context</p>
        {savingsCents > 0 ? (
          <>
            <h3 className="mt-1 text-lg text-text">
              You save {formatCurrency(savingsCents)} versus a dedicated van
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              That estimate compares this spare-capacity trip with the typical dedicated-truck
              price for the same size job.
            </p>
          </>
        ) : (
          <>
            <h3 className="mt-1 text-lg text-text">
              Spare-capacity pricing keeps this route lean
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              We only show a savings callout when this listing is clearly below a dedicated truck.
            </p>
          </>
        )}
      </Card>

      <PriceBreakdown
        basePriceCents={trip.priceCents}
        needsStairs={needsStairs}
        stairsExtraCents={trip.rules.stairsExtraCents}
        needsHelper={needsHelper}
        helperExtraCents={trip.rules.helperExtraCents}
        dedicatedEstimateCents={trip.dedicatedEstimateCents}
      />

      <BookingForm
        trip={trip}
        isAuthenticated={isAuthenticated}
        id="booking-form"
        onOptionsChange={({ needsStairs: nextNeedsStairs, needsHelper: nextNeedsHelper }) => {
          setNeedsStairs(nextNeedsStairs);
          setNeedsHelper(nextNeedsHelper);
        }}
      />
    </div>
  );
}
