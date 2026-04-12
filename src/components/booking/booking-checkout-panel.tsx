"use client";

import { useState } from "react";

import { BookingForm, type RequestMode } from "@/components/booking/booking-form";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getConfirmedBookingChecklist } from "@/lib/booking-presenters";
import {
  MANUAL_HANDLING_POLICY_LINES,
  PROHIBITED_ITEM_POLICY_LINES,
} from "@/lib/constants";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { formatCurrency } from "@/lib/utils";
import type { MoveRequest } from "@/types/move-request";
import type { Trip } from "@/types/trip";
import type { CustomerPaymentProfile } from "@/lib/data/customer-payments";

export function BookingCheckoutPanel({
  trip,
  isAuthenticated,
  existingMoveRequest,
  initialOfferId,
  customerPaymentProfile,
}: {
  trip: Trip;
  isAuthenticated: boolean;
  existingMoveRequest?: MoveRequest | null;
  initialOfferId?: string | null;
  customerPaymentProfile?: CustomerPaymentProfile | null;
}) {
  const [needsStairs, setNeedsStairs] = useState(false);
  const [needsHelper, setNeedsHelper] = useState(false);
  const [requestMode, setRequestMode] = useState<RequestMode>("single");

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
        <p className="section-label">Request details</p>
        <h2 className="mt-1 text-lg text-text">Choose the path, then confirm fit and access</h2>
      </div>
      <Card id="request-options" className="p-4">
        <p className="section-label">Choose request path</p>
        <h3 className="mt-1 text-lg text-text">Request to Book or Fast Match</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Pick one simple path. A single request goes only to this carrier. Fast Match asks up to three fitting carriers at once and closes the others after one accepts.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setRequestMode("single")}
            className={`rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:opacity-80 ${
              requestMode === "single" ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            <p className="text-sm font-medium text-text">Request to Book</p>
            <p className="mt-2 text-sm text-text-secondary">
              Ask {trip.carrier.businessName} to review this exact trip. Best when this route already looks like the right fit.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setRequestMode("fast_match")}
            className={`rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:opacity-80 ${
              requestMode === "fast_match" ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            <p className="text-sm font-medium text-text">Fast Match</p>
            <p className="mt-2 text-sm text-text-secondary">
              Ask moverrr to reach the next-best carriers too. Best when timing matters more than waiting on one carrier response.
            </p>
          </button>
        </div>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <a href="#booking-form">
              {requestMode === "single" ? "Continue with Request to Book" : "Continue with Fast Match"}
            </a>
          </Button>
        </div>
      </Card>
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
        <p className="section-label">Request boundary</p>
        <h3 className="mt-1 text-lg text-text">Keep the decision flow inside moverrr</h3>
        <div className="mt-3 space-y-2 text-sm text-text-secondary">
          <p>Your route, item, and access details stay in one structured request so the carrier can accept, decline, or ask for clarification without side-channel chats.</p>
          <p>If the carrier never responds or declines, the response window expires instead of turning into a free-form off-platform negotiation.</p>
          <p>Once a carrier accepts, moverrr can turn the request into a live booking with proof, support, and payout records attached to the same trail.</p>
        </div>
      </Card>

      <Card className="p-4">
        <details className="group">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="section-label">What happens next</p>
              <h3 className="mt-1 text-lg text-text">Know the request timeline before you submit</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-text-secondary group-open:hidden">
              Open
            </span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-text-secondary group-open:block">
              Close
            </span>
          </summary>
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            <p>1. You choose a single request or Fast Match, then submit the move details.</p>
            <p>2. moverrr opens the response window and the carrier reviews fit, route, and access details.</p>
            <p>3. If accepted, the request becomes active and the handoff stays coordinated in-app.</p>
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
        requestMode={requestMode}
        existingMoveRequest={existingMoveRequest}
        initialOfferId={initialOfferId}
        customerPaymentProfile={customerPaymentProfile}
        onRequestModeChange={setRequestMode}
        onOptionsChange={({ needsStairs: nextNeedsStairs, needsHelper: nextNeedsHelper }) => {
          setNeedsStairs(nextNeedsStairs);
          setNeedsHelper(nextNeedsHelper);
        }}
      />
    </div>
  );
}
