import Link from "next/link";

import { QuickPostTemplates } from "@/components/carrier/quick-post-templates";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { listCarrierTemplates } from "@/lib/data/templates";
import { listCarrierTrips } from "@/lib/data/trips";
import { PageIntro } from "@/components/layout/page-intro";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function CarrierDashboardPage() {
  const user = await requirePageSessionUser();
  const [carrier, carrierTrips] = await Promise.all([
    getCarrierByUserId(user.id),
    listCarrierTrips(user.id),
  ]);
  const templates = carrier ? await listCarrierTemplates(carrier.id) : [];

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="section-label">Active listings</p>
          <p className="mt-2 text-3xl text-text">{carrierTrips.length}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Upcoming stops</p>
          <p className="mt-2 text-3xl text-text">4</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Projected payout</p>
          <p className="mt-2 text-3xl text-text">{`$${carrierTrips.length * 85}`}</p>
        </Card>
      </div>

      <TripChecklist />

      <QuickPostTemplates templates={templates} />

      <div className="grid gap-4">
        {carrierTrips.map((trip) => (
          <Link key={trip.id} href={`/carrier/trips/${trip.id}`}>
            <Card className="p-4">
              <h2 className="text-lg text-text">{trip.route.label}</h2>
              <p className="mt-2 subtle-text">
                {trip.tripDate} · {trip.timeWindow} · Space {trip.spaceSize}
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
