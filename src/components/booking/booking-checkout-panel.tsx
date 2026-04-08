"use client";

import { useState } from "react";

import { BookingForm } from "@/components/booking/booking-form";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { Card } from "@/components/ui/card";
import { getConfirmedBookingChecklist } from "@/lib/booking-presenters";
import {
  MANUAL_HANDLING_POLICY_LINES,
  PROHIBITED_ITEM_POLICY_LINES,
} from "@/lib/constants";
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
  const prepChecklist = getConfirmedBookingChecklist();

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

      <Card className="p-4">
        <p className="section-label">Payment reassurance</p>
        <h3 className="mt-1 text-lg text-text">Your money is held until the job is properly completed</h3>
        <div className="mt-3 space-y-2 text-sm text-text-secondary">
          <p>Your card is authorized during booking so the spare-capacity spot is reserved.</p>
          <p>moverrr only captures the payment after proof, delivery, and completion rules are satisfied.</p>
          <p>If the carrier never confirms, the pending hold expires instead of turning into a free-form off-platform negotiation.</p>
          <p>If the route cannot proceed cleanly, ops can review the in-platform proof trail instead of chat screenshots.</p>
        </div>
      </Card>

      <Card className="p-4">
        <details className="group">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
            <div>
              <p className="section-label">What happens next</p>
              <h3 className="mt-1 text-lg text-text">Know the booking timeline before you pay</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-text-secondary group-open:hidden">
              Open
            </span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-text-secondary group-open:block">
              Close
            </span>
          </summary>
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            <p>1. The carrier confirms the booking before the pending hold expires.</p>
            <p>2. Pickup happens on the trip date during the listed window with route-fit handoff details confirmed in-app.</p>
            <p>3. Delivery proof is captured, then you confirm receipt so payout can be released.</p>
            <p>4. Any extra charges must stay inside the listed add-ons or an admin-reviewed exception.</p>
          </div>
        </details>
      </Card>

      <Card className="p-4">
        <p className="section-label">Keep It In-Platform</p>
        <h3 className="mt-1 text-lg text-text">Do not move payment or side-deals outside moverrr</h3>
        <div className="mt-3 space-y-2 text-sm text-text-secondary">
          <p>The booking amount, proof record, and dispute path all depend on the transaction staying in moverrr.</p>
          <p>If a carrier asks for cash, bank transfer, or a day-of-job extra outside the listed add-ons, stop and report it in-platform.</p>
        </div>
      </Card>

      <Card className="p-4">
        <p className="section-label">Safety boundary</p>
        <h3 className="mt-1 text-lg text-text">Unsafe or regulated loads are not part of this booking</h3>
        <div className="mt-3 space-y-2 text-sm text-text-secondary">
          {PROHIBITED_ITEM_POLICY_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="section-label">Prepare for pickup</p>
        <h3 className="mt-1 text-lg text-text">Get the handoff ready before the window starts</h3>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          {prepChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>Measure the item and flag stairs, helpers, or awkward access before paying.</li>
          {MANUAL_HANDLING_POLICY_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
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
