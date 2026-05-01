import Link from "next/link";
import { notFound } from "next/navigation";

import { CarrierTripRunsheet } from "@/components/carrier/carrier-trip-runsheet";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { requirePageSessionUser } from "@/lib/auth";
import { listCarrierBookings } from "@/lib/data/bookings";
import { getTripById } from "@/lib/data/trips";

export default async function CarrierTripRunsheetPage(
  props: {
    params: Promise<{ tripId: string }>;
  }
) {
  const params = await props.params;
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
        title="Next stop, proof, payout"
        description="This runsheet stays grounded in the real booking queue with large mobile actions, proof capture, and payout risk visible first."
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
