import Link from "next/link";
import { ArrowRight, BadgeCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, formatSavings } from "@/lib/utils";
import type { Trip } from "@/types/trip";

interface TripCardProps {
  trip: Trip;
  href?: string;
}

export function TripCard({ trip, href }: TripCardProps) {
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
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span>{formatDate(trip.tripDate)}</span>
              <span>{trip.timeWindow}</span>
              <span>Space {trip.spaceSize}</span>
              <span>Detour {trip.detourRadiusKm}km</span>
            </div>
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
