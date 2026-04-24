import Link from "next/link";
import { notFound } from "next/navigation";

import { CarrierTripBookingsPanel } from "@/components/carrier/carrier-trip-bookings-panel";
import { UndoPublishToast } from "@/components/carrier/undo-publish-toast";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { TripEditForm } from "@/components/carrier/trip-edit-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { listCarrierBookings } from "@/lib/data/bookings";
import { getTripById } from "@/lib/data/trips";
import { formatCurrency, formatDate } from "@/lib/utils";

function buildRouteMapHref(
  originSuburb: string,
  destinationSuburb: string,
  originLatitude?: number,
  originLongitude?: number,
  destinationLatitude?: number,
  destinationLongitude?: number,
) {
  if (
    originLatitude !== undefined &&
    originLongitude !== undefined &&
    destinationLatitude !== undefined &&
    destinationLongitude !== undefined
  ) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLatitude},${originLongitude}&destination=${destinationLatitude},${destinationLongitude}`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originSuburb)}&destination=${encodeURIComponent(destinationSuburb)}`;
}

export default async function CarrierTripDetailShellPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePageSessionUser();
  const trip = await getTripById(params.tripId);

  if (!trip || trip.carrier.userId !== user.id) {
    notFound();
  }

  const bookings = await listCarrierBookings(user.id, { listingId: trip.id });
  const focusValue = searchParams?.focus;
  const focusBookingId = Array.isArray(focusValue) ? focusValue[0] : focusValue;
  const activeBookingCount = bookings.filter((booking) =>
    ["pending", "confirmed", "picked_up", "in_transit", "delivered"].includes(booking.status),
  ).length;
  const proofRiskCount = bookings.filter(
    (booking) =>
      (["picked_up", "in_transit", "delivered", "completed"].includes(booking.status) &&
        !booking.pickupProofPhotoUrl) ||
      (["delivered", "completed"].includes(booking.status) && !booking.deliveryProofPhotoUrl),
  ).length;
  const payoutLoadedCents = bookings.reduce(
    (sum, booking) => sum + booking.pricing.carrierPayoutCents,
    0,
  );
  const acceptedItems = trip.rules.accepts.map((item) => item.replaceAll("_", " ")).join(", ");
  const routeMapHref = buildRouteMapHref(
    trip.route.originSuburb,
    trip.route.destinationSuburb,
    trip.route.originLatitude,
    trip.route.originLongitude,
    trip.route.destinationLatitude,
    trip.route.destinationLongitude,
  );

  const justPublished = searchParams?.published === "1" && trip.status !== "draft";

  return (
    <main id="main-content" className="screen">
      {justPublished ? <UndoPublishToast tripId={trip.id} /> : null}
      <PageIntro
        eyebrow="Trip detail"
        title="Keep one trip operationally tidy"
        description="Bookings, proof risk, and route edits all stay on the same surface so you can work a lane without bouncing between scaffolds."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/carrier/trips">Back to trips</Link>
            </Button>
            <Button asChild>
              <Link href={`/carrier/trips/${trip.id}/runsheet`}>Open runsheet</Link>
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="section-label">Route</p>
            <h2 className="mt-1 text-lg text-text">{trip.route.label}</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {formatDate(trip.tripDate)} · {trip.timeWindow} · {trip.vehicle.type.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Status {trip.status?.replaceAll("_", " ") ?? "active"} · Remaining capacity {trip.remainingCapacityPct}% · Base route price {formatCurrency(trip.priceCents)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
              <span className="rounded-full border border-border px-3 py-1">
                Detour {trip.detourRadiusKm}km · {trip.detourTolerance}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Accepts {acceptedItems || "general loads"}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                {trip.rules.stairsOk ? `Stairs +${formatCurrency(trip.rules.stairsExtraCents)}` : "No stairs"}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                {trip.rules.helperAvailable ? `Helper +${formatCurrency(trip.rules.helperExtraCents)}` : "Solo operator"}
              </span>
            </div>
            {trip.rules.specialNotes ? (
              <p className="mt-3 rounded-xl border border-border bg-black/[0.02] px-3 py-2 text-sm text-text-secondary dark:bg-white/[0.04]">
                {trip.rules.specialNotes}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <a href={routeMapHref} target="_blank" rel="noreferrer">
                  Open route in Maps
                </a>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/carrier/requests">Open request queue</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Bookings in play</p>
              <p className="mt-2 text-2xl text-text">{activeBookingCount}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Payout loaded</p>
              <p className="mt-2 text-2xl text-text">{formatCurrency(payoutLoadedCents)}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Proof risk</p>
              <p className="mt-2 text-2xl text-text">{proofRiskCount}</p>
              <p className="mt-1 text-sm text-text-secondary">
                Stops where proof is still missing after the status already moved forward.
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Recurrence</p>
              <p className="mt-2 text-sm text-text-secondary">
                {trip.recurrence?.days.length
                  ? `Repeats on ${trip.recurrence.days.join(", ")}`
                  : "One-off lane"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <CarrierTripBookingsPanel
          listingId={trip.id}
          carrierId={trip.carrier.id}
          initialBookings={bookings}
          focusBookingId={focusBookingId}
          tripStatus={trip.status === "draft" ? "draft" : "active"}
        />

        <TripChecklist carrier={trip.carrier} />
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Edit this trip</p>
            <h2 className="mt-1 text-lg text-text">Adjust timing, capacity, and publish state without leaving the lane</h2>
          </div>
          <TripEditForm trip={trip} />
        </div>
      </Card>
    </main>
  );
}
