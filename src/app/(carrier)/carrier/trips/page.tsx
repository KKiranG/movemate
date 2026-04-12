import Link from "next/link";
import type { Metadata } from "next";

import { requirePageSessionUser } from "@/lib/auth";
import { listCarrierTrips } from "@/lib/data/trips";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Carrier trips",
};

function TripSection({
  title,
  description,
  trips,
}: {
  title: string;
  description: string;
  trips: Awaited<ReturnType<typeof listCarrierTrips>>;
}) {
  if (trips.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <div>
        <p className="section-label">{title}</p>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      <div className="grid gap-4">
        {trips.map((trip) => (
          <Link key={trip.id} href={`/carrier/trips/${trip.id}`}>
            <Card className="p-4">
              <h2 className="text-lg text-text">{trip.route.label}</h2>
              <p className="mt-2 subtle-text">
                {trip.tripDate} · {trip.timeWindow} · Remaining {trip.remainingCapacityPct}%
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Status {trip.status?.replace("_", " ") ?? "active"} · Vehicle{" "}
                {trip.vehicle.type.replaceAll("_", " ")}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function CarrierTripsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePageSessionUser();
  const trips = await listCarrierTrips(user.id);
  const posted = searchParams?.posted === "1";
  const liveTrips = trips.filter((trip) => ["active", "booked_partial"].includes(trip.status ?? "active"));
  const draftTrips = trips.filter((trip) => trip.status === "draft");
  const pausedTrips = trips.filter((trip) => trip.status === "paused");
  const archivedTrips = trips.filter((trip) =>
    ["cancelled", "expired", "booked_full"].includes(trip.status ?? ""),
  );

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier trips"
        title="Manage your live and drafted trips"
        description="Keep active routes, drafts, paused trips, and archive history tidy without leaving the carrier workflow."
      />

      {posted ? (
        <Card className="border-success/20 bg-success/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-success">Trip posted successfully</p>
              <p className="mt-1 text-sm text-text-secondary">
                Your route is live. Head back to carrier home to watch incoming activity.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/carrier/dashboard">Go to carrier home</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6">
        <TripSection
          title="Live trips"
          description="Active and partially booked routes that can still accept matching work."
          trips={liveTrips}
        />
        <TripSection
          title="Drafts"
          description="Routes you have saved but not published yet."
          trips={draftTrips}
        />
        <TripSection
          title="Paused"
          description="Hidden from matching, but still editable when you need to tighten timing or rules."
          trips={pausedTrips}
        />
        <TripSection
          title="Archive"
          description="Older cancelled, expired, or filled routes for quick reference."
          trips={archivedTrips}
        />
        {trips.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">No trips yet. Post your first route to start receiving bookings.</p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
