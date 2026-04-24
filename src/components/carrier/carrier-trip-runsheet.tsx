import Link from "next/link";

import { CarrierTripBookingsPanel } from "@/components/carrier/carrier-trip-bookings-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getConfirmedBookingChecklist } from "@/lib/booking-presenters";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Trip } from "@/types/trip";

function buildRouteMapHref(trip: Trip) {
  if (
    trip.route.originLatitude !== undefined &&
    trip.route.originLongitude !== undefined &&
    trip.route.destinationLatitude !== undefined &&
    trip.route.destinationLongitude !== undefined
  ) {
    return `https://www.google.com/maps/dir/?api=1&origin=${trip.route.originLatitude},${trip.route.originLongitude}&destination=${trip.route.destinationLatitude},${trip.route.destinationLongitude}`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.route.originSuburb)}&destination=${encodeURIComponent(trip.route.destinationSuburb)}`;
}

export function CarrierTripRunsheet({
  trip,
  bookings,
}: {
  trip: Trip;
  bookings: Booking[];
}) {
  const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
  const activeDeliveryCount = bookings.filter((booking) =>
    ["picked_up", "in_transit"].includes(booking.status),
  ).length;
  const completedCount = bookings.filter((booking) =>
    ["delivered", "completed"].includes(booking.status),
  ).length;
  const payoutLoadedCents = bookings.reduce(
    (sum, booking) => sum + booking.pricing.carrierPayoutCents,
    0,
  );

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="section-label">Route</p>
            <h2 className="mt-1 text-lg text-text">{trip.route.label}</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {formatDate(trip.tripDate)} · {trip.timeWindow} · {trip.vehicle.type.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Remaining capacity {trip.remainingCapacityPct}% · Base route price {formatCurrency(trip.priceCents)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <a href={buildRouteMapHref(trip)} target="_blank" rel="noreferrer">
                  Open route in Maps
                </a>
              </Button>
              <Button asChild size="sm">
                <Link href={`/carrier/trips/${trip.id}`}>Open trip detail</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Ready for pickup</p>
              <p className="mt-2 text-2xl text-text">{confirmedCount}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">In motion</p>
              <p className="mt-2 text-2xl text-text">{activeDeliveryCount}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Completed today</p>
              <p className="mt-2 text-2xl text-text">{completedCount}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Payout on board</p>
              <p className="mt-2 text-2xl text-text">{formatCurrency(payoutLoadedCents)}</p>
            </div>
          </div>
        </div>
      </Card>

      <CarrierTripBookingsPanel
        listingId={trip.id}
        carrierId={trip.carrier.id}
        initialBookings={bookings}
        variant="runsheet"
        tripStatus={trip.status === "draft" ? "draft" : "active"}
      />

      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <p className="section-label">Before departure</p>
            <h2 className="mt-1 text-lg text-text">Keep these checks tight while you are mobile</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {getConfirmedBookingChecklist().map((item) => (
              <div key={item} className="rounded-xl border border-border p-3 text-sm text-text-secondary">
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
