import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TimeBar } from "@/components/ui/time-bar";
import { ITEM_CATEGORY_LABELS, SPACE_SIZE_DESCRIPTIONS } from "@/lib/constants";
import {
  getBaseCustomerPriceCents,
  getTripFitConfidenceLabel,
  getTripRouteFitLabel,
  getTripFitSummary,
  getTripTimingBadges,
  getTripTrustStack,
} from "@/lib/trip-presenters";
import { formatCurrency, formatDate, formatSavings } from "@/lib/utils";
import type { Trip, TripSearchResult } from "@/types/trip";

interface TripCardProps {
  trip: Trip | TripSearchResult;
  href?: string;
}

function isTripSearchResult(
  trip: Trip | TripSearchResult,
): trip is TripSearchResult {
  return (
    "matchScore" in trip &&
    typeof trip.matchScore === "number" &&
    "breakdown" in trip &&
    typeof trip.breakdown === "object" &&
    trip.breakdown !== null
  );
}

const VEHICLE_TYPE_LABELS: Record<Trip["vehicle"]["type"], string> = {
  van: "Van",
  ute: "Ute",
  small_truck: "Small truck",
  large_truck: "Large truck",
  trailer: "Trailer",
};

const SPACE_SIZE_EXAMPLES: Record<Trip["spaceSize"], string> = {
  S: "Usually suits 2 boxes or a compact marketplace pickup",
  M: "Usually suits 1 appliance, desk, or mattress-sized item",
  L: "Usually suits several bulky items or a light studio move",
  XL: "Usually suits large furniture or most of a spare bay",
};

export function TripCard({ trip, href }: TripCardProps) {
  const isFullyBooked =
    trip.remainingCapacityPct <= 0 || trip.status === "booked_full";
  const timingBadges = getTripTimingBadges(trip);
  const trustRow = getTripTrustStack(trip).map((label) =>
    label.includes("reviews") ? label.replace(" from ", " · ") : label,
  );
  const searchHref = `/search?${new URLSearchParams({
    from: trip.route.originSuburb,
    to: trip.route.destinationSuburb,
  }).toString()}`;
  const cardHref = isFullyBooked ? searchHref : href;
  const fitLabel = isTripSearchResult(trip)
    ? getTripFitConfidenceLabel(trip.matchScore)
    : "Likely fits";
  const routeFitLabel = getTripRouteFitLabel(trip);

  const content = (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border">
            <Truck className="h-5 w-5 text-text" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base text-text">
                {trip.carrier.businessName}
              </h3>
              {trip.carrier.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : null}
              <Badge>{VEHICLE_TYPE_LABELS[trip.vehicle.type]}</Badge>
              {timingBadges.slice(0, 2).map((badge) => (
                <Badge key={badge}>{badge}</Badge>
              ))}
              {trip.isReturnTrip ? (
                <Badge className="border-success/20 bg-success/10 text-success">
                  Return trip
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-text-secondary">
              {trip.route.via.length > 0
                ? `${trip.route.label} via ${trip.route.via.join(", ")}`
                : trip.route.label}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                  Fit
                </p>
                <p className="mt-1 text-sm font-medium text-text">{fitLabel}</p>
              </div>
              <div className="rounded-xl border border-border px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                  Route
                </p>
                <p className="mt-1 text-sm font-medium text-text">
                  {routeFitLabel}
                </p>
              </div>
              <div className="rounded-xl border border-border px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                  Timing
                </p>
                <p className="mt-1 text-sm font-medium text-text">
                  {formatDate(trip.tripDate)}
                </p>
              </div>
            </div>
            <TimeBar timeWindow={trip.timeWindow} />
            {trustRow.length > 0 ? (
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text">Trust:</span>{" "}
                {trustRow.join(" · ")}
              </p>
            ) : null}
            <div className="rounded-xl border border-accent/10 bg-accent/5 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                Why this matches
              </p>
              <p className="mt-1 text-sm text-text">
                {getTripFitSummary(trip)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span>{SPACE_SIZE_EXAMPLES[trip.spaceSize]}</span>
              <span>{trip.detourRadiusKm} km corridor pickup range</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              {trip.carrier.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-1 text-success">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Proof-backed flow
                </span>
              ) : null}
            </div>
            <div className="hidden space-y-2 sm:block">
              <p className="text-sm text-text-secondary">
                {SPACE_SIZE_DESCRIPTIONS[trip.spaceSize]}
              </p>
              <p className="text-sm text-text-secondary">
                Best for{" "}
                {trip.rules.accepts
                  .map((item) => ITEM_CATEGORY_LABELS[item])
                  .join(", ")
                  .toLowerCase()}
                .
              </p>
            </div>
            <details className="sm:hidden">
              <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-accent active:opacity-80">
                More info
              </summary>
              <div className="space-y-2 pb-1">
                <p className="text-sm text-text-secondary">
                  {SPACE_SIZE_DESCRIPTIONS[trip.spaceSize]}
                </p>
                <p className="text-sm text-text-secondary">
                  Best for{" "}
                  {trip.rules.accepts
                    .map((item) => ITEM_CATEGORY_LABELS[item])
                    .join(", ")
                    .toLowerCase()}
                  .
                </p>
              </div>
            </details>
            {trip.isReturnTrip ? (
              <p className="text-sm font-medium text-success">
                Return trips often cost less because the carrier is already
                coming back.
              </p>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            Customer total
          </p>
          <p className="text-2xl font-medium text-text">
            {formatCurrency(getBaseCustomerPriceCents(trip))}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Includes moverrr charges before any selected add-ons.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Optional stairs or helper add-ons only if you select them.
          </p>
          {trip.savingsPct > 5 ? (
            <>
              <p className="text-sm text-text-secondary line-through">
                {formatCurrency(trip.dedicatedEstimateCents)}
              </p>
              <p className="text-sm font-medium text-savings">
                {formatSavings(trip.savingsPct)}
              </p>
            </>
          ) : (
            <p className="text-sm text-text-secondary">
              Dedicated van pricing varies by route.
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <span className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white active:bg-[#0047b3]">
          {isFullyBooked
            ? "Fully booked - see similar trips"
            : "Request this trip"}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );

  if (!cardHref) {
    return content;
  }

  return (
    <Link href={cardHref} className="group block active:opacity-95">
      {content}
    </Link>
  );
}
