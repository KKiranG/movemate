import Link from "next/link";
import { BadgeCheck, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ITEM_CATEGORY_LABELS,
  MANUAL_HANDLING_POLICY_LINES,
  PROHIBITED_ITEM_POLICY_LINES,
  SPACE_SIZE_DESCRIPTIONS,
} from "@/lib/constants";
import {
  getTripCustomerPricePreview,
  getTripNearbyDateExplanation,
  getTripRouteFitLabel,
} from "@/lib/trip-presenters";
import { getRouteContextMap } from "@/lib/maps/directions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Trip } from "@/types/trip";

interface TripDetailSummaryProps {
  trip: Trip;
  preferredDate?: string;
  matchExplanation?: string;
  ctaHref?: string;
}

export function TripDetailSummary({
  trip,
  preferredDate,
  matchExplanation,
  ctaHref = "#booking-form",
}: TripDetailSummaryProps) {
  const pricingPreview = getTripCustomerPricePreview(trip.priceCents);
  const routeFitLabel = getTripRouteFitLabel(trip);
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
        <div className="rounded-xl border border-border p-4">
          <p className="section-label">Carrier</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-accent" />
                <Link
                  href={`/carrier/${trip.carrier.id}`}
                  className="text-lg font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                >
                  {trip.carrier.businessName}
                </Link>
                <Badge>{trip.vehicle.type.replaceAll("_", " ")}</Badge>
                {trip.carrier.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-1 text-xs text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-text-secondary">
                {trip.carrier.ratingCount > 0
                  ? `${trip.carrier.averageRating.toFixed(1)} rating from ${trip.carrier.ratingCount} reviews`
                  : "New carrier profile"}
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              {formatDate(trip.tripDate)} · {trip.timeWindow}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="section-label">Route logic</p>
          <div className="mt-2 space-y-2 text-sm text-text-secondary">
            <p className="text-text">{trip.route.label}</p>
            <p>{matchExplanation ?? routeFitLabel}</p>
            {nearbyDateExplanation ? <p>{nearbyDateExplanation}</p> : null}
            <p>Corridor radius: about {trip.detourRadiusKm} km.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="section-label">Vehicle fit</p>
          <div className="mt-2 space-y-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2 text-text">
              <Truck className="h-4 w-4" />
              <span>{trip.vehicle.type.replaceAll("_", " ")}</span>
            </div>
            <p>{SPACE_SIZE_DESCRIPTIONS[trip.spaceSize]}</p>
            <p>
              Best for{" "}
              {trip.rules.accepts
                .map((item) => ITEM_CATEGORY_LABELS[item].toLowerCase())
                .join(", ")}
              .
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {trip.rules.accepts.map((item) => (
                <Badge key={item}>{ITEM_CATEGORY_LABELS[item]}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="section-label">Price breakdown</p>
          <div className="mt-3 grid gap-2 text-sm text-text-secondary">
            <div className="flex items-center justify-between gap-4">
              <span>Carrier route price</span>
              <span className="text-text">{formatCurrency(pricingPreview.basePriceCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Platform fee</span>
              <span className="text-text">{formatCurrency(pricingPreview.platformFeeCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>GST</span>
              <span className="text-text">{formatCurrency(pricingPreview.gstCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
              <span className="font-medium text-text">Customer total</span>
              <span className="text-base font-medium text-text">
                {formatCurrency(pricingPreview.totalPriceCents)}
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-text-secondary">
            <p>
              Optional add-ons: stairs{" "}
              {trip.rules.stairsOk ? formatCurrency(trip.rules.stairsExtraCents) : "not available"}.
            </p>
            <p>
              Optional add-ons: helper{" "}
              {trip.rules.helperAvailable ? formatCurrency(trip.rules.helperExtraCents) : "not available"}.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-black/[0.02] p-4 text-sm text-text-secondary dark:bg-white/[0.04]">
          Exact street details stay private until acceptance. Payment and approved changes stay in-platform.
        </div>

        <Link
          href={ctaHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
        >
          Continue to checkout
        </Link>

        <details className="rounded-xl border border-border p-4">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
            <div>
              <p className="section-label">Full details</p>
              <p className="mt-1 text-sm text-text-secondary">Route context, handling rules, and policy notes</p>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">Open</span>
          </summary>
          <div className="mt-4 space-y-4">
            {routeMap ? (
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-text">Route context</p>
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
                  </svg>
                </div>
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-accent"
                  >
                    Open route in Google Maps
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-text">Manual handling</p>
                <div className="mt-2 space-y-2 text-sm text-text-secondary">
                  {MANUAL_HANDLING_POLICY_LINES.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-text">Prohibited items</p>
                <div className="mt-2 space-y-2 text-sm text-text-secondary">
                  {PROHIBITED_ITEM_POLICY_LINES.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {trip.rules.specialNotes ? (
              <div className="rounded-xl border border-border p-3 text-sm text-text-secondary">
                <p className="font-medium text-text">Carrier notes</p>
                <p className="mt-2">{trip.rules.specialNotes}</p>
              </div>
            ) : null}
          </div>
        </details>
      </div>
    </Card>
  );
}
