import { PrivateProofTile } from "@/components/booking/private-proof-tile";
import { Card } from "@/components/ui/card";
import { getCarrierActivationLabel, isCarrierActivationLive } from "@/lib/carrier-activation";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import type { Booking } from "@/types/booking";
import type { CarrierProfile } from "@/types/carrier";

function isDocumentCurrent(value?: string | null) {
  if (!value) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed >= today;
}

export async function CarrierTrustPanel({
  carrier,
  bookings,
  liveListingCount,
}: {
  carrier: CarrierProfile | null;
  bookings: Booking[];
  liveListingCount: number;
}) {
  if (!carrier) {
    return null;
  }

  const completedProofBackedJobs = bookings.filter(
    (booking) =>
      booking.status === "completed" &&
      booking.pickupProofPhotoUrl &&
      booking.deliveryProofPhotoUrl,
  );
  const proofExamples = completedProofBackedJobs
    .flatMap((booking) => [
      {
        key: `${booking.id}:pickup`,
        path: booking.pickupProofPhotoUrl,
        title: "Pickup proof",
        subtitle: booking.bookingReference,
      },
      {
        key: `${booking.id}:delivery`,
        path: booking.deliveryProofPhotoUrl,
        title: "Delivery proof",
        subtitle: booking.bookingReference,
      },
    ])
    .slice(0, 4);

  const badges = [
    {
      label: "Activation gate",
      ready: isCarrierActivationLive(carrier.activationStatus),
      helper:
        isCarrierActivationLive(carrier.activationStatus)
          ? "Ops approved this carrier for live marketplace work."
          : `${getCarrierActivationLabel(carrier.activationStatus)}. Live requests stay blocked until this clears.`,
    },
    {
      label: "Business details",
      ready: Boolean(carrier.serviceSuburbs.length > 0 && carrier.contactName),
      helper: carrier.abnVerified
        ? "ABN is on file and marked as an extra trust booster."
        : "ABN is optional for activation but still worth adding as a trust signal.",
    },
    {
      label: "Payout ready",
      ready: carrier.stripeOnboardingComplete,
      helper: carrier.stripeOnboardingComplete
        ? "Payout details are linked."
        : "Finish payout setup before release.",
    },
    {
      label: "Docs current",
      ready: isDocumentCurrent(carrier.licenceExpiryDate) && isDocumentCurrent(carrier.insuranceExpiryDate),
      helper:
        isDocumentCurrent(carrier.licenceExpiryDate) && isDocumentCurrent(carrier.insuranceExpiryDate)
          ? carrier.insuranceVerified
            ? "Licence and insurance are current and insurance has been reviewed."
            : "Licence and insurance are current."
          : "Expired or missing dates will slow trust review.",
    },
    {
      label: "Proof history",
      ready: completedProofBackedJobs.length > 0,
      helper:
        completedProofBackedJobs.length > 0
          ? `${completedProofBackedJobs.length} completed jobs with pickup and delivery proof.`
          : "Complete a few proof-backed jobs to build trust faster.",
    },
  ];

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <p className="section-label">Carrier profile signals</p>
          <h2 className="mt-1 text-lg text-text">Evidence-led trust, not brochure copy</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Customers judge supply on verification, proof, and operational follow-through. This is
            the trust stack your profile is building.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className={`rounded-xl border p-3 ${
                badge.ready
                  ? "border-success/20 bg-success/5"
                  : "border-border bg-black/[0.02] dark:bg-white/[0.04]"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                {badge.label}
              </p>
              <p className="mt-2 text-sm font-medium text-text">
                {badge.ready ? "Ready" : "Needs work"}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{badge.helper}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Live routes</p>
            <p className="mt-2 text-2xl text-text">{liveListingCount}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Proof-backed jobs</p>
            <p className="mt-2 text-2xl text-text">{completedProofBackedJobs.length}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Public rating</p>
            <p className="mt-2 text-2xl text-text">
              {carrier.ratingCount > 0 ? carrier.averageRating.toFixed(1) : "New"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {carrier.ratingCount} review{carrier.ratingCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div>
          <p className="section-label">Proof gallery</p>
          {proofExamples.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {proofExamples.map((proof) => (
                <PrivateProofTile
                  key={proof.key}
                  bucket={PRIVATE_BUCKETS.proofPhotos}
                  path={proof.path}
                  title={proof.title}
                  subtitle={proof.subtitle}
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-secondary">
              Pickup and delivery proof examples will appear here after your first completed,
              proof-backed jobs land.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
