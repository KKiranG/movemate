import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingStatusStepper } from "@/components/booking/booking-status-stepper";
import { ConfirmReceiptButton } from "@/components/booking/confirm-receipt-button";
import { DisputeForm } from "@/components/booking/dispute-form";
import { PaymentRecoveryCard } from "@/components/booking/payment-recovery-card";
import { PendingExpiryCountdown } from "@/components/booking/pending-expiry-countdown";
import { PrintReceiptButton } from "@/components/booking/print-receipt-button";
import { PrivateProofTile } from "@/components/booking/private-proof-tile";
import { ReviewForm } from "@/components/booking/review-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingPaymentStateSummary, getConfirmedBookingChecklist } from "@/lib/booking-presenters";
import { getBookingByIdForUser } from "@/lib/data/bookings";
import { getBookingFeedbackForUser } from "@/lib/data/feedback";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requirePageSessionUser();
  const [booking, feedback] = await Promise.all([
    getBookingByIdForUser(user.id, params.id),
    getBookingFeedbackForUser(user.id, params.id),
  ]);

  if (!booking) {
    notFound();
  }

  const paymentSummary = getBookingPaymentStateSummary(booking);
  const checklist = getConfirmedBookingChecklist();
  const bookSimilarHref = `/search?${new URLSearchParams({
    from: booking.pickupSuburb ?? "",
    to: booking.dropoffSuburb ?? "",
    what: booking.itemCategory,
  }).toString()}`;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Booking detail"
        title={booking.bookingReference}
        description="Track fulfilment, confirm receipt, retry payment if needed, and keep a clean receipt for reimbursements."
      />

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Status</p>
            <p className="mt-1 text-sm text-text-secondary">{booking.itemDescription}</p>
          </div>
          <BookingStatusStepper status={booking.status} />
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium text-text">{paymentSummary.badge}</p>
            <p className="mt-1 text-sm text-text-secondary">{paymentSummary.description}</p>
          </div>
          {booking.status === "pending" && booking.pendingExpiresAt ? (
            <PendingExpiryCountdown expiresAt={booking.pendingExpiresAt} />
          ) : null}
          {paymentSummary.retryable ? (
            <PaymentRecoveryCard
              bookingId={booking.id}
              title={paymentSummary.title}
              description={paymentSummary.description}
            />
          ) : null}
          {booking.status === "delivered" ? (
            <ConfirmReceiptButton bookingId={booking.id} />
          ) : null}
          {booking.status === "completed" ? (
            <Button asChild variant="secondary">
              <Link href={bookSimilarHref}>Book a similar trip</Link>
            </Button>
          ) : null}
        </div>
      </Card>

      {["confirmed", "picked_up", "in_transit", "delivered", "completed"].includes(booking.status) ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Preparation checklist</p>
              <h2 className="mt-1 text-lg text-text">What to have ready</h2>
            </div>
            <div className="grid gap-2">
              {checklist.map((item) => (
                <div key={item} className="rounded-xl border border-border px-3 py-2 text-sm text-text-secondary">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {booking.pickupProofPhotoUrl || booking.deliveryProofPhotoUrl ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Proof gallery</p>
              <h2 className="mt-1 text-lg text-text">Pickup and delivery evidence</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <PrivateProofTile
                bucket={PRIVATE_BUCKETS.proofPhotos}
                path={booking.pickupProofPhotoUrl}
                title="Pickup proof"
                subtitle={booking.createdAt ? `Uploaded after ${formatDateTime(booking.createdAt)}` : undefined}
              />
              <PrivateProofTile
                bucket={PRIVATE_BUCKETS.proofPhotos}
                path={booking.deliveryProofPhotoUrl}
                title="Delivery proof"
                subtitle={booking.deliveredAt ? `Uploaded ${formatDateTime(booking.deliveredAt)}` : undefined}
              />
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Reviews</p>
            <h2 className="mt-1 text-lg text-text">Close the loop after fulfilment</h2>
          </div>
          <div className="grid gap-3">
            {feedback.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border p-3">
                <p className="text-sm text-text">
                  {review.reviewerType} rated this booking {review.rating}/5
                </p>
                {review.comment ? (
                  <p className="mt-2 subtle-text">{review.comment}</p>
                ) : null}
              </div>
            ))}
            {feedback.reviews.length === 0 ? (
              <p className="subtle-text">No reviews submitted yet.</p>
            ) : null}
          </div>
          {booking.status === "completed" && !feedback.userReview ? (
            <ReviewForm bookingId={booking.id} />
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Disputes</p>
            <h2 className="mt-1 text-lg text-text">Escalate with evidence, not chat</h2>
          </div>
          <div className="grid gap-3">
            {feedback.disputes.map((dispute) => (
              <div key={dispute.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm capitalize text-text">
                    {dispute.category.replace("_", " ")}
                  </p>
                  <span className="text-xs uppercase tracking-[0.18em] text-accent">
                    {dispute.status}
                  </span>
                </div>
                <p className="mt-2 subtle-text">{dispute.description}</p>
                {dispute.resolutionNotes ? (
                  <p className="mt-2 text-sm text-text">
                    Resolution: {dispute.resolutionNotes}
                  </p>
                ) : null}
              </div>
            ))}
            {feedback.disputes.length === 0 ? (
              <p className="subtle-text">No disputes have been raised for this booking.</p>
            ) : null}
          </div>
          {booking.status !== "cancelled" ? <DisputeForm bookingId={booking.id} /> : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-label">Receipt</p>
              <h2 className="mt-1 text-lg text-text">Receipt {booking.bookingReference}</h2>
            </div>
            <PrintReceiptButton />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm text-text-secondary">Route</p>
              <p className="mt-1 text-sm text-text">
                {booking.pickupAddress} to {booking.dropoffAddress}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm text-text-secondary">Created</p>
              <p className="mt-1 text-sm text-text">
                {booking.createdAt ? formatDateTime(booking.createdAt) : "Pending"}
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Base fare</span>
              <span>{formatCurrency(booking.pricing.basePriceCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Stairs fee</span>
              <span>{formatCurrency(booking.pricing.stairsFeeCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Helper fee</span>
              <span>{formatCurrency(booking.pricing.helperFeeCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>Booking fee</span>
              <span>{formatCurrency(booking.pricing.bookingFeeCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium text-text">
              <span>Total paid</span>
              <span>{formatCurrency(booking.pricing.totalPriceCents)}</span>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
