import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking/booking-form";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { PageIntro } from "@/components/layout/page-intro";
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
  const description = `${trip.carrier.businessName} has spare space on ${trip.tripDate}. ${trip.spaceSize} capacity · Verified carrier · Save vs. dedicated truck.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "moverrr",
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
            <BookingForm trip={trip} isAuthenticated={Boolean(user)} />
          </div>
        </Card>

        <PriceBreakdown
          pricing={pricing}
          dedicatedEstimateCents={trip.dedicatedEstimateCents}
        />
      </div>
    </main>
  );
}
