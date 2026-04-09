import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CarrierOpsForm } from "@/components/admin/carrier-ops-form";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requirePageAdminUser } from "@/lib/auth";
import { getAdminCarrierDetail } from "@/lib/data/carriers";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin carrier detail",
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getExpiryTone(date?: string | null) {
  if (!date) {
    return "Not set";
  }

  const daysUntil = Math.round((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  if (daysUntil < 0) {
    return `Expired ${Math.abs(daysUntil)}d ago`;
  }

  if (daysUntil <= 30) {
    return `${daysUntil}d left`;
  }

  return `${daysUntil}d left`;
}

export default async function AdminCarrierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAdminUser();
  const { id } = await params;
  const detail = await getAdminCarrierDetail(id);

  if (!detail) {
    notFound();
  }

  const averageRating =
    detail.reviews.length > 0
      ? detail.reviews.reduce((sum, review) => sum + review.rating, 0) / detail.reviews.length
      : 0;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin carriers"
        title={detail.carrier.businessName}
        description="Full supply review for documents, internal ops context, Stripe payout state, and recent booking proof history."
        actions={
          <Button asChild variant="secondary">
            <Link href="/admin/carriers">Back to carriers</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="section-label">Verification</p>
          <p className="mt-2 text-2xl text-text capitalize">{detail.carrier.verificationStatus}</p>
          <p className="mt-2 text-sm text-text-secondary">
            Submitted {formatDateTime(detail.carrier.verificationSubmittedAt)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Completed jobs</p>
          <p className="mt-2 text-2xl text-text">{detail.completedBookings}</p>
          <p className="mt-2 text-sm text-text-secondary">
            Proof-backed {detail.proofBackedJobs}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Stripe Connect</p>
          <p className="mt-2 text-2xl text-text">
            {detail.carrier.stripeOnboardingComplete ? "Ready" : "Setup missing"}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {detail.carrier.stripeAccountId ?? "No account id yet"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Reviews</p>
          <p className="mt-2 text-2xl text-text">
            {detail.reviews.length > 0 ? averageRating.toFixed(1) : "New"}
          </p>
          <p className="mt-2 text-sm text-text-secondary">{detail.reviews.length} review(s)</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <ErrorBoundary
          fallback={
            <Card className="p-4">
              <p className="text-sm text-text-secondary">
                Carrier detail failed to render. Refresh and retry this admin view.
              </p>
            </Card>
          }
        >
          <div className="grid gap-4">
            <Card className="p-4">
              <p className="section-label">Profile</p>
              <h2 className="mt-1 text-lg text-text">{detail.carrier.contactName}</h2>
              <div className="mt-3 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                <p>Email: {detail.carrier.email}</p>
                <p>Phone: {detail.carrier.phone}</p>
                <p>ABN: {detail.carrier.abn ?? "Not provided"}</p>
                <p>Service suburbs: {detail.carrier.serviceSuburbs.join(", ") || "Not set"}</p>
              </div>
              {detail.carrier.bio ? <p className="mt-3 text-sm text-text">{detail.carrier.bio}</p> : null}
            </Card>

            <Card className="p-4">
              <p className="section-label">Documents</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Licence",
                    expiry: detail.carrier.licenceExpiryDate,
                    href: detail.documents.licence?.signedUrl,
                  },
                  {
                    label: "Insurance",
                    expiry: detail.carrier.insuranceExpiryDate,
                    href: detail.documents.insurance?.signedUrl,
                  },
                  {
                    label: "Vehicle photo",
                    expiry: null,
                    href: detail.documents.vehicle?.signedUrl,
                  },
                ].map((document) => (
                  <div key={document.label} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium text-text">{document.label}</p>
                    {document.expiry ? (
                      <p className="mt-1 text-sm text-text-secondary">
                        Expiry {document.expiry} · {getExpiryTone(document.expiry)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-text-secondary">
                      {document.href ? "Uploaded" : "Missing"}
                    </p>
                    {document.href ? (
                      <a
                        href={document.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-accent active:opacity-80"
                      >
                        Open document
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <p className="section-label">Vehicle and payout state</p>
              <div className="mt-3 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                <p>
                  Vehicle:{" "}
                  {detail.vehicle
                    ? `${detail.vehicle.type.replaceAll("_", " ")} ${detail.vehicle.make ?? ""} ${detail.vehicle.model ?? ""}`.trim()
                    : "No active vehicle"}
                </p>
                <p>
                  Capacity:{" "}
                  {detail.vehicle
                    ? `${detail.vehicle.maxVolumeM3}m3 · ${detail.vehicle.maxWeightKg}kg`
                    : "Not available"}
                </p>
                <p>
                  Rego: {detail.vehicle?.regoPlate ?? "Not provided"}
                </p>
                <p>
                  Stripe status: {detail.carrier.stripeOnboardingComplete ? "Payout ready" : "Needs setup"}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <p className="section-label">Recent bookings</p>
              <div className="mt-4 grid gap-3">
                {detail.bookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-text">{booking.bookingReference}</p>
                      <p className="text-sm text-text-secondary capitalize">
                        {booking.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {formatCurrency(booking.totalPriceCents)} · Payment {booking.paymentStatus ?? "pending"}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Created {formatDateTime(booking.createdAt)} ·{" "}
                      {booking.proofComplete ? "Proof complete" : "Proof still incomplete"}
                    </p>
                  </div>
                ))}
                {detail.bookings.length === 0 ? (
                  <p className="text-sm text-text-secondary">No bookings tied to this carrier yet.</p>
                ) : null}
              </div>
            </Card>
          </div>
        </ErrorBoundary>

        <ErrorBoundary
          fallback={
            <Card className="p-4">
              <p className="text-sm text-text-secondary">
                Ops controls failed to render. Refresh and retry.
              </p>
            </Card>
          }
        >
          <div className="grid gap-4">
            <Card className="p-4">
              <p className="section-label">Ops controls</p>
              <div className="mt-4">
                <CarrierOpsForm carrier={detail.carrier} />
              </div>
            </Card>

            <Card className="p-4">
              <p className="section-label">Current internal tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(detail.carrier.internalTags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex min-h-[44px] items-center rounded-xl border border-accent/20 bg-accent/5 px-3 text-sm capitalize text-accent"
                  >
                    {tag}
                  </span>
                ))}
                {(detail.carrier.internalTags ?? []).length === 0 ? (
                  <p className="text-sm text-text-secondary">No internal tags set.</p>
                ) : null}
              </div>
            </Card>

            <Card className="p-4">
              <p className="section-label">Off-platform payment flags</p>
              <div className="mt-4 grid gap-3">
                {detail.offPlatformPaymentSignals.map((signal) => (
                  <div key={signal.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium text-text">
                      Attempt logged {formatDateTime(signal.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {signal.specialInstructions ?? "No captured note text available."}
                    </p>
                  </div>
                ))}
                {detail.offPlatformPaymentSignals.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No off-platform payment attempts logged for this carrier yet.
                  </p>
                ) : null}
              </div>
            </Card>

            <Card className="p-4">
              <p className="section-label">Recent reviews</p>
              <div className="mt-4 grid gap-3">
                {detail.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium text-text">{review.rating}/5</p>
                    <p className="mt-1 text-sm text-text-secondary">{formatDateTime(review.createdAt)}</p>
                    {review.comment ? <p className="mt-2 text-sm text-text">{review.comment}</p> : null}
                  </div>
                ))}
                {detail.reviews.length === 0 ? (
                  <p className="text-sm text-text-secondary">No reviews on record yet.</p>
                ) : null}
              </div>
            </Card>
          </div>
        </ErrorBoundary>
      </div>
    </main>
  );
}
