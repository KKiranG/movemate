import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageIntro } from "@/components/layout/page-intro";
import { TripCard } from "@/components/trip/trip-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPublicCarrierProfile } from "@/lib/data/carriers";
import { listReviewsForCarrier } from "@/lib/data/feedback";
import { listPublicTripsForCarrier } from "@/lib/data/trips";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const profile = await getPublicCarrierProfile(params.id);

  if (!profile) {
    return {
      title: "Carrier not found | moverrr",
    };
  }

  return {
    title: `${profile.carrier.businessName} | moverrr carrier`,
    description: `${profile.carrier.businessName} is a verified moverrr carrier with ${profile.completedJobCount} completed jobs and ${profile.activeListingCount} active listings.`,
    alternates: {
      canonical: `/carrier/${params.id}`,
    },
  };
}

export default async function CarrierProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [profile, trips] = await Promise.all([
    getPublicCarrierProfile(params.id),
    listPublicTripsForCarrier(params.id),
  ]);

  if (!profile) {
    notFound();
  }

  const reviews = await listReviewsForCarrier(params.id);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier profile"
        title={profile.carrier.businessName}
        description="Trust view for customers before they book into a spare-capacity trip."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <Card className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {profile.carrier.isVerified ? (
              <Badge className="border-success/20 bg-success/10 text-success">Verified carrier</Badge>
            ) : null}
            {profile.vehicle ? <Badge>{profile.vehicle.type}</Badge> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <p className="section-label">Completed jobs</p>
              <p className="mt-2 text-3xl text-text">{profile.completedJobCount}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="section-label">Average rating</p>
              <p className="mt-2 text-3xl text-text">
                {profile.carrier.ratingCount > 0
                  ? profile.carrier.averageRating.toFixed(1)
                  : "New"}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">About this carrier</p>
            <p className="mt-2 text-sm text-text-secondary">
              {profile.carrier.bio ??
                "This carrier is active on moverrr and publishes real spare-capacity trips for Sydney jobs."}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Vehicle</p>
            <p className="mt-2 text-sm text-text-secondary">
              {profile.vehicle
                ? `${profile.vehicle.type} · up to ${profile.vehicle.maxVolumeM3}m3 and ${profile.vehicle.maxWeightKg}kg`
                : "Vehicle details are available on each trip."}
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="section-label">Active listings</p>
            <h2 className="mt-1 text-lg text-text">
              {profile.activeListingCount} live spare-capacity routes
            </h2>
          </Card>
          <Card className="p-4">
            <p className="section-label">Recent reviews</p>
            <div className="mt-3 grid gap-3">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm text-text">
                    {review.rating}/5 {review.comment ? `· ${review.comment}` : ""}
                  </p>
                  {review.carrierResponse ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Carrier response: {review.carrierResponse}
                    </p>
                  ) : null}
                </div>
              ))}
              {reviews.length === 0 ? (
                <p className="subtle-text">No public reviews yet.</p>
              ) : null}
            </div>
          </Card>
          <div className="grid gap-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} href={`/trip/${trip.id}`} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
