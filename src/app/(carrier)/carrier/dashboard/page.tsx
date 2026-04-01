import { Suspense } from "react";
import Link from "next/link";

import { LiveBookingsList } from "@/components/carrier/live-bookings-list";
import { PendingBookingsAlert } from "@/components/carrier/pending-bookings-alert";
import { QuickPostTemplates } from "@/components/carrier/quick-post-templates";
import { CarrierTrustPanel } from "@/components/carrier/carrier-trust-panel";
import { TripListSkeleton } from "@/components/carrier/trip-list-skeleton";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { getCarrierLaneInsights, listCarrierBookings } from "@/lib/data/bookings";
import { listCarrierTemplates } from "@/lib/data/templates";
import { listCarrierTrips } from "@/lib/data/trips";
import { PageIntro } from "@/components/layout/page-intro";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function isTripActive(tripDate: string, status?: string | null) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);
  const tripDay = new Date(`${tripDate}T00:00:00`);

  return (
    ["active", "booked_partial"].includes(status ?? "active") &&
    !Number.isNaN(tripDay.getTime()) &&
    tripDay >= cutoff
  );
}

async function CarrierDashboardContent({ userId }: { userId: string }) {
  const [carrier, carrierTrips, carrierBookings, laneInsights] = await Promise.all([
    getCarrierByUserId(userId),
    listCarrierTrips(userId),
    listCarrierBookings(userId),
    getCarrierLaneInsights(userId),
  ]);
  const templates = carrier ? await listCarrierTemplates(carrier.id) : [];
  const liveListings = carrierTrips.filter((trip) => isTripActive(trip.tripDate, trip.status)).length;
  const pendingBookings = carrierBookings.filter((booking) => booking.status === "pending");
  const awaitingDecision = carrierBookings.filter((booking) => booking.status === "pending").length;
  const bookedWork = carrierBookings.filter((booking) =>
    ["confirmed", "picked_up", "in_transit", "delivered"].includes(booking.status),
  ).length;
  const projectedPayoutCents = carrierBookings
    .filter((booking) => !["cancelled", "completed"].includes(booking.status))
    .reduce((sum, booking) => sum + booking.pricing.carrierPayoutCents, 0);
  const activityFeed = [
    ...carrierTrips.map((trip) => ({
      id: `trip-${trip.id}`,
      occurredAt: trip.publishAt ?? trip.tripDate,
      title: "Trip posted",
      description: `${trip.route.label} is available with ${trip.remainingCapacityPct}% capacity remaining.`,
      href: `/carrier/trips/${trip.id}`,
    })),
    ...carrierBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      occurredAt: booking.updatedAt ?? booking.createdAt ?? new Date().toISOString(),
      title:
        booking.status === "pending"
          ? "Booking requested"
          : booking.status === "confirmed"
            ? "Booking confirmed"
            : "Booking updated",
      description: `${booking.bookingReference} · ${booking.status.replaceAll("_", " ")} · ${formatCurrency(booking.pricing.totalPriceCents)}`,
      href: `/carrier/trips/${booking.listingId}?focus=${booking.id}#booking-${booking.id}`,
    })),
  ]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 20);
  const activeTrips = carrierTrips.filter((trip) => isTripActive(trip.tripDate, trip.status));
  const pastTrips = carrierTrips.filter((trip) => !isTripActive(trip.tripDate, trip.status));

  return (
    <>
      <PendingBookingsAlert bookings={pendingBookings} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/carrier/trips" className="block min-h-11 active:opacity-95">
          <Card className="p-4">
          <p className="section-label">Live listings</p>
          <p className="mt-2 text-3xl text-text">{liveListings}</p>
          </Card>
        </Link>
        <Link href="/carrier/trips?filter=pending" className="block min-h-11 active:opacity-95">
          <Card className="p-4">
          <p className="section-label">Awaiting decision</p>
          <p className="mt-2 text-3xl text-text">{awaitingDecision}</p>
          </Card>
        </Link>
        <Link href="/carrier/trips" className="block min-h-11 active:opacity-95">
          <Card className="p-4">
          <p className="section-label">Booked work</p>
          <p className="mt-2 text-3xl text-text">{bookedWork}</p>
          </Card>
        </Link>
        <Link href="/carrier/payouts" className="block min-h-11 active:opacity-95">
          <Card className="p-4">
          <p className="section-label">Projected payout</p>
          <p className="mt-2 text-3xl text-text">{formatCurrency(projectedPayoutCents)}</p>
          </Card>
        </Link>
      </div>

      <TripChecklist carrier={carrier} />

      {carrier && carrier.verificationStatus !== "verified" ? (
        <Card className="border-warning/20 bg-warning/10 p-4">
          <p className="section-label">Verification</p>
          <h2 className="mt-1 text-lg text-text">
            {carrier.verificationStatus === "rejected" ? "Action needed to get verified" : "Verification still in progress"}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {carrier.verificationNotes ??
              "Check your onboarding details, expiry dates, and uploaded documents so admin can approve you quickly."}
          </p>
        </Card>
      ) : null}

      <CarrierTrustPanel
        carrier={carrier}
        bookings={carrierBookings}
        liveListingCount={liveListings}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Button asChild variant="secondary">
          <Link href="/carrier/payouts">View payouts</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/carrier/stats">Performance stats</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/carrier/templates">Manage templates</Link>
        </Button>
      </div>

      <QuickPostTemplates templates={templates} />

      <LiveBookingsList carrierId={carrier?.id ?? ""} initialBookings={carrierBookings} />

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Activity feed</p>
            <h2 className="mt-1 text-lg text-text">What changed since your last visit</h2>
          </div>
          <div className="grid gap-3">
            {activityFeed.map((item) => (
              <Link key={item.id} href={item.href} className="rounded-xl border border-border p-3 active:opacity-95">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text">{item.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                  </div>
                  <p className="text-xs text-text-secondary">{formatDateTime(item.occurredAt)}</p>
                </div>
              </Link>
            ))}
            {activityFeed.length === 0 ? (
              <p className="subtle-text">Post a trip to start building your carrier activity timeline.</p>
            ) : null}
          </div>
        </div>
      </Card>

      {laneInsights.length > 0 ? (
        <Card className="p-4">
          <p className="section-label">Top corridors</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {laneInsights.map((lane) => (
              <div key={lane.corridor} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-text">{lane.corridor}</p>
                <p className="mt-1 text-sm text-text-secondary">{lane.jobs} completed jobs</p>
                <p className="mt-2 text-lg text-text">{formatCurrency(lane.earningsCents)}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {activeTrips.map((trip) => (
          <Link
            key={trip.id}
            href={`/carrier/trips/${trip.id}`}
            className="block min-h-11 active:opacity-95"
          >
            <Card className="p-4">
              <h2 className="text-lg text-text">{trip.route.label}</h2>
              <p className="mt-2 subtle-text">
                {trip.tripDate} · {trip.timeWindow} · Space {trip.spaceSize}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Status {trip.status?.replace("_", " ") ?? "active"} · Remaining capacity{" "}
                {trip.remainingCapacityPct}%
              </p>
            </Card>
          </Link>
        ))}
        {activeTrips.length === 0 ? (
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="subtle-text">
                No trips yet. Complete onboarding and post your first spare-capacity run.
              </p>
              <Button asChild>
                <Link href="/carrier/post">Post your first trip</Link>
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      {pastTrips.length > 0 ? (
        <details className="rounded-xl border border-border bg-surface p-4">
          <summary className="min-h-[44px] cursor-pointer list-none text-sm font-medium text-text active:opacity-80 [&::-webkit-details-marker]:hidden">
            Past trips
          </summary>
          <div className="mt-4 grid gap-4">
            {pastTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/carrier/trips/${trip.id}`}
                className="block min-h-11 active:opacity-95"
              >
                <Card className="p-4">
                  <h2 className="text-lg text-text">{trip.route.label}</h2>
                  <p className="mt-2 subtle-text">
                    {trip.tripDate} · {trip.timeWindow} · Space {trip.spaceSize}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    Status {trip.status?.replace("_", " ") ?? "active"} · Remaining capacity{" "}
                    {trip.remainingCapacityPct}%
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

export default async function CarrierDashboardPage() {
  const user = await requirePageSessionUser();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier dashboard"
        title="Fill spare capacity without the quote chase"
        description="Active listings, incoming bookings, and trip-day actions all live here in the MVP."
        actions={
          <Button asChild size="sm">
            <Link href="/carrier/post">Post a trip</Link>
          </Button>
        }
      />

      <ErrorBoundary fallback={<TripListSkeleton />}>
        <Suspense fallback={<TripListSkeleton />}>
          <CarrierDashboardContent userId={user.id} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
