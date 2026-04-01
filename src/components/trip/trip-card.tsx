import Link from "next/link";
import { ArrowRight, BadgeCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TimeBar } from "@/components/ui/time-bar";
import { getCapacityIndicator } from "@/lib/data/listings";
import {
  ITEM_CATEGORY_LABELS,
  SPACE_SIZE_DESCRIPTIONS,
  SPACE_SIZE_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatSavings } from "@/lib/utils";
import type { Trip } from "@/types/trip";

interface TripCardProps {
  trip: Trip;
  href?: string;
}

export function TripCard({ trip, href }: TripCardProps) {
  const capacityIndicator = getCapacityIndicator(trip.remainingCapacityPct);

  const content = (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border">
            <Truck className="h-5 w-5 text-text" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base text-text">{trip.carrier.businessName}</h3>
              {trip.carrier.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : null}
              <Badge>{trip.vehicle.type}</Badge>
              {trip.isReturnTrip ? (
                <Badge className="border-success/20 bg-success/10 text-success">
                  Return trip
                </Badge>
              ) : null}
              {capacityIndicator ? (
                <Badge>{capacityIndicator.label}</Badge>
              ) : null}
            </div>
            <p className="text-sm text-text-secondary">
              {trip.carrier.ratingCount > 0
                ? `★ ${trip.carrier.averageRating.toFixed(1)} (${trip.carrier.ratingCount} reviews)`
                : "New carrier"}
            </p>
            <p className="text-sm text-text-secondary">
              {trip.route.via.length > 0
                ? `${trip.route.label} via ${trip.route.via.join(", ")}`
                : trip.route.label}
            </p>
            <TimeBar timeWindow={trip.timeWindow} />
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span>{formatDate(trip.tripDate)}</span>
              <span>
                Space {SPACE_SIZE_LABELS[trip.spaceSize]}
              </span>
              <span>Detour {trip.detourRadiusKm}km</span>
            </div>
            <p className="text-sm text-text-secondary">{SPACE_SIZE_DESCRIPTIONS[trip.spaceSize]}</p>
            <p className="text-sm text-text-secondary">
              Best for {trip.rules.accepts.map((item) => ITEM_CATEGORY_LABELS[item]).join(", ").toLowerCase()}.
            </p>
            {trip.isReturnTrip ? (
              <p className="text-sm font-medium text-success">
                Backload pricing usually means a bigger saving than booking a dedicated van.
              </p>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-medium text-text">
            {formatCurrency(trip.priceCents)}
          </p>
          <p className="text-sm text-text-secondary line-through">
            {formatCurrency(trip.dedicatedEstimateCents)}
          </p>
          <p className="text-sm font-medium text-savings">
            {formatSavings(trip.savingsPct)}
          </p>
          {capacityIndicator ? (
            <p className="mt-2 text-xs text-text-secondary">{capacityIndicator.description}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="group block active:opacity-95">
      {content}
      <div className="mt-2 flex items-center justify-end gap-2 text-sm font-medium text-accent">
        View trip
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5" />
      </div>
    </Link>
  );
}
