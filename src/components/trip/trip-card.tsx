import Link from "next/link";
import { ArrowRight, BadgeCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getTripAllInPriceSummary,
  getTripFitSummary,
  getTripTrustStack,
} from "@/lib/trip-presenters";
import { formatCurrency } from "@/lib/utils";
import type { Trip, TripSearchResult } from "@/types/trip";

interface TripCardProps {
  trip: Trip | TripSearchResult;
  href?: string;
  /** When true the card is visually selected (Fast Match multi-select mode). */
  selected?: boolean;
  /** Fires when the card is tapped in multi-select mode. */
  onSelect?: (id: string) => void;
}

const VEHICLE_TYPE_LABELS: Record<Trip["vehicle"]["type"], string> = {
  van: "Van",
  ute: "Ute",
  small_truck: "Small truck",
  large_truck: "Large truck",
  trailer: "Trailer",
};

export function TripCard({ trip, href, selected, onSelect }: TripCardProps) {
  const isFullyBooked = trip.remainingCapacityPct <= 0 || trip.status === "booked_full";

  // One-line trust signal: verified + rating or trip count.
  const trustStack = getTripTrustStack(trip);
  const trustLine = trustStack.length > 0 ? trustStack[0] : null;

  // One-line match rationale (e.g. "Already travelling Inner West → Bondi with spare room").
  const matchRationale = getTripFitSummary(trip);

  const allIn = getTripAllInPriceSummary(trip.priceCents, trip.minimumBasePriceCents);

  const content = (
    <Card
      className={`p-4 transition-colors ${selected ? "border-accent bg-accent/5" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: identity + rationale + trust */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border">
              <Truck className="h-4 w-4 text-text" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-text">{trip.carrier.businessName}</span>
                {trip.carrier.isVerified ? (
                  <BadgeCheck className="h-3.5 w-3.5 text-success" />
                ) : null}
                <Badge>{VEHICLE_TYPE_LABELS[trip.vehicle.type]}</Badge>
              </div>
              {trustLine ? (
                <p className="mt-0.5 text-xs text-text-secondary">{trustLine}</p>
              ) : null}
            </div>
          </div>

          <p className="text-sm text-text">{matchRationale}</p>
        </div>

        {/* Right: price */}
        <div className="shrink-0 text-right">
          <p className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">All in</p>
          <p className="text-xl font-semibold tabular-nums text-text">
            {formatCurrency(allIn.totalPriceCents)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {isFullyBooked ? (
          <span className="text-sm text-text-secondary">Unavailable</span>
        ) : selected !== undefined ? (
          <span className="text-sm font-medium text-accent">
            {selected ? "Selected" : "Tap to select"}
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 text-sm font-medium text-[var(--bg-base)] transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-[var(--text-primary)]/25 hover:opacity-90 active:opacity-80">
          {isFullyBooked ? "Unavailable" : "View offer"}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );

  // Multi-select mode: tap fires onSelect instead of navigating.
  if (onSelect && !isFullyBooked) {
    return (
      <button
        type="button"
        onClick={() => onSelect(trip.id)}
        className="block w-full rounded-[var(--radius-lg)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:opacity-95"
      >
        {content}
      </button>
    );
  }

  // Fully booked: render non-interactive (no /search redirect).
  if (isFullyBooked || !href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="group block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:opacity-95"
    >
      {content}
    </Link>
  );
}
