import Link from "next/link";

import { requirePageSessionUser } from "@/lib/auth";
import { listCarrierTrips } from "@/lib/data/trips";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function CarrierTripsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePageSessionUser();
  const trips = await listCarrierTrips(user.id);
  const posted = searchParams?.posted === "1";

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier trips"
        title="Manage posted inventory"
        description="Listings are the core inventory unit. This view becomes the operational heart of supply-side usage."
      />

      {posted ? (
        <Card className="border-success/20 bg-success/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-success">Trip posted successfully</p>
              <p className="mt-1 text-sm text-text-secondary">
                Your route is live. Head back to the dashboard to watch incoming activity.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/carrier/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {trips.map((trip) => (
          <Link key={trip.id} href={`/carrier/trips/${trip.id}`}>
            <Card className="p-4">
              <h2 className="text-lg text-text">{trip.route.label}</h2>
              <p className="mt-2 subtle-text">
                {trip.tripDate} · {trip.timeWindow} · Remaining {trip.remainingCapacityPct}%
              </p>
            </Card>
          </Link>
        ))}
        {trips.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">No trips yet. Post your first route to start receiving bookings.</p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
