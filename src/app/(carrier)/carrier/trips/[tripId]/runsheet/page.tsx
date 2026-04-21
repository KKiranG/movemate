import Link from "next/link";
import { notFound } from "next/navigation";

import { CarrierTripRunsheet } from "@/components/carrier/carrier-trip-runsheet";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { requirePageSessionUser } from "@/lib/auth";
import { listCarrierBookings } from "@/lib/data/bookings";
import { getTripById } from "@/lib/data/trips";

export default async function CarrierTripRunsheetPage({
  params,
}: {
  params: { tripId: string };
}) {
  const user = await requirePageSessionUser();
  const trip = await getTripById(params.tripId);

  if (!trip || trip.carrier.userId !== user.id) {
    notFound();
  }

  const bookings = await listCarrierBookings(user.id, { listingId: trip.id });

  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="Runsheet"
        title="Use the trip as a mobile operating surface"
        description="This runsheet stays grounded in the real booking queue. Stop order, proof risk, and maps stay big enough for in-vehicle use."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`/carrier/trips/${trip.id}`}>Back to trip</Link>
            </Button>
            <Button asChild>
              <Link href="/carrier">Carrier home</Link>
            </Button>
          </div>
        }
      />

      <CarrierTripRunsheet trip={trip} bookings={bookings} />
    </main>
  );
}
