import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking/booking-form";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { PageIntro } from "@/components/layout/page-intro";
import { ShareTripButton } from "@/components/trip/share-trip-button";
import { Card } from "@/components/ui/card";
import { TripDetailSummary } from "@/components/trip/trip-detail-summary";
import { getOptionalSessionUser } from "@/lib/auth";
import { getTripById } from "@/lib/data/trips";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";

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

  const pricing = calculateBookingBreakdown({
    basePriceCents: trip.priceCents,
    needsStairs: false,
    stairsExtraCents: trip.rules.stairsExtraCents,
    needsHelper: false,
    helperExtraCents: trip.rules.helperExtraCents,
  });
  const price = `$${Math.round(trip.priceCents / 100)}`;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Trip detail"
        title="Confirm fit, then book into the trip"
        description="The booking flow stays transactional: route, price, item details, addresses, payment."
      />

      <TripDetailSummary trip={trip} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Booking form</p>
              <h2 className="mt-1 text-lg text-text">Item and address details</h2>
            </div>
            <Card className="border-success/20 bg-success/5 p-4">
              <p className="section-label">Savings context</p>
              <h3 className="mt-1 text-lg text-text">
                Typically ${Math.max(120, Math.round((trip.dedicatedEstimateCents - trip.priceCents) / 100) - 40)} to $
                {Math.round((trip.dedicatedEstimateCents - trip.priceCents) / 100) + 40} cheaper
                than booking a dedicated van
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                This listing is priced as spare capacity on a route the carrier is already taking,
                so you are sharing the run instead of paying for a whole truck on its own.
              </p>
            </Card>
            <BookingForm trip={trip} isAuthenticated={Boolean(user)} />
          </div>
        </Card>

        <div className="space-y-4">
          <PriceBreakdown
            pricing={pricing}
            dedicatedEstimateCents={trip.dedicatedEstimateCents}
          />
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
