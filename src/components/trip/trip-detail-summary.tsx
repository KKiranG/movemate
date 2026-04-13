import Link from "next/link";
import { BadgeCheck, Package2, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TimeBar } from "@/components/ui/time-bar";
import {
  ITEM_CATEGORY_LABELS,
  MANUAL_HANDLING_POLICY_LINES,
  PROHIBITED_ITEM_POLICY_LINES,
  SPACE_SIZE_DESCRIPTIONS,
} from "@/lib/constants";
import {
  getTripCustomerPricePreview,
  getTripFitConfidenceLabel,
  getTripFitReviewExplanation,
  getTripNearbyDateExplanation,
  getTripRouteFitLabel,
} from "@/lib/trip-presenters";
import { getRouteContextMap } from "@/lib/maps/directions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Trip } from "@/types/trip";

interface TripDetailSummaryProps {
  trip: Trip;
  preferredDate?: string;
}

export function TripDetailSummary({ trip, preferredDate }: TripDetailSummaryProps) {
  const pricingPreview = getTripCustomerPricePreview(trip.priceCents);
  const routeFitLabel = getTripRouteFitLabel(trip);
  const fitConfidenceLabel = getTripFitConfidenceLabel();
  const fitReviewExplanation = getTripFitReviewExplanation({
    breakdown: {
      pickupDistanceKm: 0,
      dropoffDistanceKm: 0,
      routeFit: 0,
      destinationFit: 0,
      reliability: 0,
      priceFit: 0,
    },
    matchScore:
      routeFitLabel === "Needs approval" ? 40 : fitConfidenceLabel === "Review photos" ? 55 : 75,
    rules: trip.rules,
    spaceSize: trip.spaceSize,
  });
  const nearbyDateExplanation = getTripNearbyDateExplanation({
    preferredDate,
    tripDate: trip.tripDate,
  });
  const routeMap = getRouteContextMap({
    originLatitude: trip.route.originLatitude,
    originLongitude: trip.route.originLongitude,
    destinationLatitude: trip.route.destinationLatitude,
    destinationLongitude: trip.route.destinationLongitude,
  });
  const includedItems = [
    "Route-fit transport on a trip that is already happening",
    "Pickup and dropoff inside the stated corridor radius",
    "Pickup and delivery proof captured in-app before payout release",
  ];
  const notIncludedItems = [
    "Packing materials or full-service removalist labour",
    "Dismantling, assembly, or surprise day-of-move extras",
    "Exact street address disclosure before booking is confirmed",
    "Dangerous goods, asbestos, regulated disposal, or contaminated waste",
  ];
  const addOnItems = [
    trip.rules.stairsOk
      ? `Stairs support available for ${formatCurrency(trip.rules.stairsExtraCents)} if needed`
      : "No stairs jobs on this route",
    trip.rules.helperAvailable
      ? `Helper available for ${formatCurrency(trip.rules.helperExtraCents)} if needed`
      : "Single-operator handoff unless noted otherwise",
  ];
  const mapsHref =
    trip.route.originLatitude &&
    trip.route.originLongitude &&
    trip.route.destinationLatitude &&
    trip.route.destinationLongitude
      ? `https://www.google.com/maps/dir/?api=1&origin=${trip.route.originLatitude},${trip.route.originLongitude}&destination=${trip.route.destinationLatitude},${trip.route.destinationLongitude}`
      : null;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="section-label">Real trip first</p>
            <h1 className="text-2xl text-text">{trip.route.label}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span>{formatDate(trip.tripDate)}</span>
              <span>{fitConfidenceLabel}</span>
              <span>{routeFitLabel}</span>
              {nearbyDateExplanation ? <span>{nearbyDateExplanation}</span> : null}
              {trip.isReturnTrip ? (
                <Badge className="border-success/20 bg-success/10 text-success">Return trip</Badge>
              ) : null}
            </div>
            <TimeBar timeWindow={trip.timeWindow} />
            <p className="text-sm text-text">
              You are requesting spare room on a trip that is already happening, so the price is
              usually lower than hiring a dedicated truck for the whole job.
            </p>
            {fitReviewExplanation ? (
              <p className="text-sm text-text-secondary">{fitReviewExplanation}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Customer total</p>
            <p className="text-2xl font-medium text-text">
              {formatCurrency(pricingPreview.totalPriceCents)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Route price, moverrr charges, and any selected add-ons are included in this total.
            </p>
            <p className="text-sm text-savings">{trip.savingsPct}% cheaper before optional add-ons</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
              <BadgeCheck className="h-4 w-4 text-accent" />
              <Link href={`/carrier/${trip.carrier.id}`} className="text-accent active:opacity-80">
                {trip.carrier.businessName}
              </Link>
            </div>
            <p className="subtle-text">
              {trip.carrier.ratingCount > 0
                ? `Rated ${trip.carrier.averageRating.toFixed(1)} from ${trip.carrier.ratingCount} reviews.`
                : "New carrier on moverrr."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
              {trip.carrier.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-1 text-success">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  ID checked
                </span>
              ) : null}
              <span className="inline-flex rounded-full border border-border px-2 py-1">
                {trip.carrier.stripeOnboardingComplete ? "Payout ready" : "Payout review pending"}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
              <Truck className="h-4 w-4" />
              {trip.vehicle.type.replaceAll("_", " ")}
            </div>
            <p className="subtle-text">
              {SPACE_SIZE_DESCRIPTIONS[trip.spaceSize]}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Best for {trip.rules.accepts.map((item) => ITEM_CATEGORY_LABELS[item]).join(", ").toLowerCase()} on this route.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Included</p>
            <ul className="mt-2 space-y-2 text-sm text-text-secondary">
              {includedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Not included</p>
            <ul className="mt-2 space-y-2 text-sm text-text-secondary">
              {notIncludedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Needs add-on or rule check</p>
            <ul className="mt-2 space-y-2 text-sm text-text-secondary">
              {addOnItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>{trip.rules.specialNotes ?? "Customer should be present for handoff and fit checks."}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trip.rules.accepts.map((item) => (
            <Badge key={item}>
              <Package2 className="mr-1 h-3 w-3" />
              {ITEM_CATEGORY_LABELS[item]}
            </Badge>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3 sm:col-span-2">
            <p className="section-label">What happens next</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                "1. Send a request for this trip and keep fit or access clarifications inside moverrr.",
                "2. moverrr places an authorization hold while the carrier reviews the request inside the response window.",
                "3. If accepted, pickup and delivery proof are captured in-app on the live route so support is not chasing chat screenshots.",
                "4. You confirm receipt, then payout release and reviews can close cleanly.",
              ].map((step) => (
                <p key={step} className="text-sm text-text-secondary">
                  {step}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Access compatibility</p>
            <p className="mt-2 text-sm text-text-secondary">
              {trip.rules.stairsOk
                ? "Stairs are accepted if you add the stairs option before paying."
                : "Ground-floor or lift-friendly handoffs only on this route."}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Pickup and dropoff should sit within {trip.detourRadiusKm}km of this corridor.
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Hold and privacy boundary</p>
            <p className="mt-2 text-sm text-text-secondary">
              Exact street addresses and direct phone details stay hidden until the booking is confirmed. Before that point you only see suburb-level route fit and the on-platform booking record.
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Keep coordination, proof, and any issue handling on-platform so moverrr has one clean record of what happened.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {routeMap ? (
            <div className="rounded-xl border border-border p-3 sm:col-span-2">
              <p className="section-label">Route context map</p>
              <p className="mt-2 text-sm text-text-secondary">
                This is a corridor-style view of the trip, shown only after selection so it explains
                fit without turning maps into the discovery layer.
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-border bg-[linear-gradient(180deg,#f7fbff_0%,#eef6ff_100%)] px-3 py-3">
                <svg
                  viewBox={`0 0 ${routeMap.width} ${routeMap.height}`}
                  className="h-[140px] w-full"
                  role="img"
                  aria-label={`Route context from ${trip.route.originSuburb} to ${trip.route.destinationSuburb}`}
                >
                  <path
                    d={routeMap.corridorPath}
                    fill="none"
                    stroke="rgba(18, 90, 187, 0.16)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d={routeMap.corridorPath}
                    fill="none"
                    stroke="#125abb"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx={routeMap.start.x} cy={routeMap.start.y} r="7" fill="#0a7a43" />
                  <circle cx={routeMap.end.x} cy={routeMap.end.y} r="7" fill="#125abb" />
                  <text x={routeMap.start.x + 10} y={routeMap.start.y - 8} fontSize="11" fill="#1f2937">
                    Pickup
                  </text>
                  <text x={routeMap.end.x + 10} y={routeMap.end.y - 8} fontSize="11" fill="#1f2937">
                    Drop-off
                  </text>
                </svg>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-text-secondary sm:grid-cols-3">
                <p>Route fit: {routeFitLabel}</p>
                <p>Corridor pickup range: about {trip.detourRadiusKm} km</p>
                <p>{nearbyDateExplanation ? `Timing: ${nearbyDateExplanation}` : "Timing matches the trip date shown above."}</p>
              </div>
            </div>
          ) : null}
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Prohibited items</p>
            <div className="mt-2 space-y-2 text-sm text-text-secondary">
              {PROHIBITED_ITEM_POLICY_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Manual-handling prompts</p>
            <div className="mt-2 space-y-2 text-sm text-text-secondary">
              {MANUAL_HANDLING_POLICY_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <details className="rounded-xl border border-border p-3">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
            <div>
              <p className="section-label">Prepare for pickup</p>
              <p className="mt-1 text-sm text-text-secondary">
                A quick checklist before the window starts
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">Open</span>
          </summary>
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            <p>Keep the item measured, accessible, and ready at ground level or within the agreed access limits.</p>
            <p>Wrap fragile items, take a quick reference photo, and flag stairs or helper needs before paying.</p>
            <p>Have access notes ready so the carrier can keep the route moving without ad-hoc phone triage.</p>
          </div>
        </details>

        {mapsHref ? (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-accent"
          >
            Open route in Google Maps
          </a>
        ) : null}
      </div>
    </Card>
  );
}
