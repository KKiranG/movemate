import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingCheckoutPanel } from "@/components/booking/booking-checkout-panel";
import { StickyBookingCta } from "@/components/booking/sticky-booking-cta";
import { PageIntro } from "@/components/layout/page-intro";
import { ShareTripButton } from "@/components/trip/share-trip-button";
import { Card } from "@/components/ui/card";
import { TripDetailSummary } from "@/components/trip/trip-detail-summary";
import { getOptionalSessionUser } from "@/lib/auth";
import { getMoveRequestByIdForCustomer } from "@/lib/data/move-requests";
import { getCustomerProfileForUser } from "@/lib/data/profiles";
import { getTripById } from "@/lib/data/trips";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

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
  searchParams,
}: {
  params: { id: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [trip, user] = await Promise.all([
    getTripById(params.id),
    getOptionalSessionUser(),
  ]);

  if (!trip) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchFrom = getSearchValue(resolvedSearchParams.from);
  const searchTo = getSearchValue(resolvedSearchParams.to);
  const searchWhen = getSearchValue(resolvedSearchParams.when);
  const searchWhat = getSearchValue(resolvedSearchParams.what);
  const searchBackload = getSearchValue(resolvedSearchParams.backload);
  const moveRequestId = getSearchValue(resolvedSearchParams.moveRequestId);
  const offerId = getSearchValue(resolvedSearchParams.offerId);
  const customer = user ? await getCustomerProfileForUser(user.id) : null;
  const existingMoveRequest =
    customer && moveRequestId ? await getMoveRequestByIdForCustomer(customer.id, moveRequestId) : null;
  const price = `$${Math.round(trip.priceCents / 100)}`;
  const savingsCents = Math.max(0, trip.dedicatedEstimateCents - trip.priceCents);
  const startingPricing = calculateBookingBreakdown({
    basePriceCents: trip.priceCents,
    needsStairs: false,
    stairsExtraCents: trip.rules.stairsExtraCents,
    needsHelper: false,
    helperExtraCents: trip.rules.helperExtraCents,
  });
  const isBookable = trip.remainingCapacityPct > 0 && trip.status !== "booked_full";
  const backHref = `/search?${new URLSearchParams({
    from: searchFrom || trip.route.originSuburb,
    to: searchTo || trip.route.destinationSuburb,
    when: searchWhen || trip.tripDate,
    ...(searchWhat ? { what: searchWhat } : {}),
    ...(searchBackload ? { backload: searchBackload } : {}),
    ...(moveRequestId ? { moveRequestId } : {}),
  }).toString()}`;
  const similarTripsHref = `/search?${new URLSearchParams({
    from: trip.route.originSuburb,
    to: trip.route.destinationSuburb,
    when: trip.tripDate,
  }).toString()}`;

  return (
    <main id="main-content" className="page-shell pb-28 lg:pb-0">
      <PageIntro
        eyebrow="Trip detail"
        title="Check trust, route fit, and request options"
        description="This page should answer whether the trip is safe, sensible, and worth requesting before you commit to a single carrier or Fast Match."
        actions={
          <Link href={backHref} className="inline-flex min-h-[44px] items-center text-sm font-medium text-accent">
            Back to results
          </Link>
        }
      />

      <TripDetailSummary trip={trip} preferredDate={searchWhen || existingMoveRequest?.route.preferredDate || undefined} />
      <StickyBookingCta
        priceCents={startingPricing.totalPriceCents}
        savingsCents={savingsCents}
        savingsNote="Starting total includes moverrr charges. Add-ons can change the final total."
        isBookable={isBookable}
        href={isBookable ? "#request-options" : similarTripsHref}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {isBookable ? (
          <BookingCheckoutPanel
            trip={trip}
            isAuthenticated={Boolean(user)}
            existingMoveRequest={existingMoveRequest}
            initialOfferId={offerId || null}
          />
        ) : (
          <Card className="p-4">
            <p className="section-label">Trip availability</p>
            <h2 className="mt-1 text-lg text-text">This trip is fully booked</h2>
            <p className="mt-2 text-sm text-text-secondary">
              This route no longer has room for another request. See similar matching trips on the same corridor instead of starting a booking that cannot be completed.
            </p>
            <div className="mt-4">
              <Link
                href={similarTripsHref}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-accent px-4 text-sm font-medium text-white active:opacity-80"
              >
                See similar trips
              </Link>
            </div>
          </Card>
        )}

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
