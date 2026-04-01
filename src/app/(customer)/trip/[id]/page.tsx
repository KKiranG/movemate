import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingCheckoutPanel } from "@/components/booking/booking-checkout-panel";
import { StickyBookingCta } from "@/components/booking/sticky-booking-cta";
import { PageIntro } from "@/components/layout/page-intro";
import { ShareTripButton } from "@/components/trip/share-trip-button";
import { Card } from "@/components/ui/card";
import { TripDetailSummary } from "@/components/trip/trip-detail-summary";
import { getOptionalSessionUser } from "@/lib/auth";
import { getTripById } from "@/lib/data/trips";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const trip = await getTripById(params.id);

  if (!trip) {
    return { title: "Trip not found - moverrr" };
  }

  const price = `$${Math.round(trip.priceCents / 100)}`;
  const title = `Move from ${trip.route.originSuburb} to ${trip.route.destinationSuburb} · ${price} - moverrr`;
  const description = `${trip.carrier.businessName} has spare space on ${trip.tripDate} from ${trip.route.originSuburb} to ${trip.route.destinationSuburb}. ${price} on moverrr with ${trip.timeWindow} timing.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "moverrr",
      images: [`/trip/${params.id}/opengraph-image`],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function TripDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [trip, user] = await Promise.all([
    getTripById(params.id),
    getOptionalSessionUser(),
  ]);

  if (!trip) {
    notFound();
  }

  const price = `$${Math.round(trip.priceCents / 100)}`;
  const savingsCents = Math.max(0, trip.dedicatedEstimateCents - trip.priceCents);

  return (
    <main id="main-content" className="page-shell pb-28 lg:pb-0">
      <PageIntro
        eyebrow="Trip detail"
        title="Confirm fit, then book into the trip"
        description="The booking flow stays transactional: route, price, item details, addresses, payment."
      />

      <TripDetailSummary trip={trip} />
      <StickyBookingCta priceCents={trip.priceCents} savingsCents={savingsCents} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <BookingCheckoutPanel trip={trip} isAuthenticated={Boolean(user)} />

        <div className="space-y-4">
          <Card className="p-4">
            <p className="section-label">Share</p>
            <h2 className="mt-1 text-lg text-text">Send this trip to someone else involved</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Useful when a third party is at pickup or dropoff and needs the exact trip link.
            </p>
            <div className="mt-4">
              <ShareTripButton
                title={`${trip.route.originSuburb} to ${trip.route.destinationSuburb} on moverrr`}
                text={`Spare-capacity trip for ${trip.route.label} on ${trip.tripDate} at ${price}.`}
              />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
