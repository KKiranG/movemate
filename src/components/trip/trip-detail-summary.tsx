import Link from "next/link";
import { BadgeCheck, Package2, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TimeBar } from "@/components/ui/time-bar";
import { ITEM_CATEGORY_LABELS, SPACE_SIZE_DESCRIPTIONS, SPACE_SIZE_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Trip } from "@/types/trip";

interface TripDetailSummaryProps {
  trip: Trip;
}

export function TripDetailSummary({ trip }: TripDetailSummaryProps) {
  const includedItems = [
    "Route-fit transport on a trip that is already happening",
    "Pickup and dropoff inside the stated corridor radius",
    "Pickup and delivery proof captured in-app before payout release",
  ];
  const notIncludedItems = [
    "Packing materials or full-service removalist labour",
    "Dismantling, assembly, or surprise day-of-move extras",
    "Exact street address disclosure before booking is confirmed",
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
              <span>Space {SPACE_SIZE_LABELS[trip.spaceSize]}</span>
              <span>{trip.remainingCapacityPct}% capacity left</span>
              {trip.isReturnTrip ? (
                <Badge className="border-success/20 bg-success/10 text-success">Return trip</Badge>
              ) : null}
            </div>
            <TimeBar timeWindow={trip.timeWindow} />
            <p className="text-sm text-text">
              You are booking into spare room on a trip that is already happening, so the price is
              lower than hiring a dedicated truck for the whole job.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-text">
              {formatCurrency(trip.priceCents)}
            </p>
            <p className="text-sm text-savings">{trip.savingsPct}% cheaper before add-ons</p>
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
              Rated {trip.carrier.averageRating.toFixed(1)} from{" "}
              {trip.carrier.ratingCount} reviews.
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
              {trip.vehicle.type}
            </div>
            <p className="subtle-text">
              Up to {trip.availableVolumeM3}m3 and {trip.availableWeightKg}kg
              remaining.
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {SPACE_SIZE_DESCRIPTIONS[trip.spaceSize]}
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
            <p className="section-label">Privacy boundary</p>
            <p className="mt-2 text-sm text-text-secondary">
              Exact street addresses stay hidden until booking is confirmed. You can see suburb and
              corridor fit now so you know whether this route makes sense before you pay.
            </p>
          </div>
        </div>

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
