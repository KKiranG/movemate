import Link from "next/link";

import { LiveBookingsList } from "@/components/carrier/live-bookings-list";
import { QuickPostTemplates } from "@/components/carrier/quick-post-templates";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { listCarrierBookings } from "@/lib/data/bookings";
import { listCarrierTemplates } from "@/lib/data/templates";
import { listCarrierTrips } from "@/lib/data/trips";
import { PageIntro } from "@/components/layout/page-intro";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function CarrierDashboardPage() {
  const user = await requirePageSessionUser();
  const [carrier, carrierTrips, carrierBookings] = await Promise.all([
    getCarrierByUserId(user.id),
    listCarrierTrips(user.id),
    listCarrierBookings(user.id),
  ]);
  const templates = carrier ? await listCarrierTemplates(carrier.id) : [];
  const liveListings = carrierTrips.filter((trip) =>
    ["active", "booked_partial"].includes(trip.status ?? "active"),
  ).length;
  const awaitingDecision = carrierBookings.filter((booking) => booking.status === "pending").length;
  const bookedWork = carrierBookings.filter((booking) =>
    ["confirmed", "picked_up", "in_transit", "delivered"].includes(booking.status),
  ).length;
  const projectedPayoutCents = carrierBookings
    .filter((booking) => !["cancelled", "completed"].includes(booking.status))
    .reduce((sum, booking) => sum + booking.pricing.carrierPayoutCents, 0);

  return (
    <main className="page-shell">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="section-label">Live listings</p>
          <p className="mt-2 text-3xl text-text">{liveListings}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Awaiting decision</p>
          <p className="mt-2 text-3xl text-text">{awaitingDecision}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Booked work</p>
          <p className="mt-2 text-3xl text-text">{bookedWork}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Projected payout</p>
          <p className="mt-2 text-3xl text-text">{formatCurrency(projectedPayoutCents)}</p>
        </Card>
      </div>

      <TripChecklist />

      <QuickPostTemplates templates={templates} />

      <LiveBookingsList carrierId={carrier?.id ?? ""} initialBookings={carrierBookings} />

      <div className="grid gap-4">
        {carrierTrips.map((trip) => (
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
        {carrierTrips.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">
              No trips yet. Complete onboarding and post your first spare-capacity run.
            </p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
