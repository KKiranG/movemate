import { notFound } from "next/navigation";

import { ConfirmReceiptButton } from "@/components/booking/confirm-receipt-button";
import { DisputeForm } from "@/components/booking/dispute-form";
import { ReviewForm } from "@/components/booking/review-form";
import { BookingStatusStepper } from "@/components/booking/booking-status-stepper";
import { PendingExpiryCountdown } from "@/components/booking/pending-expiry-countdown";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingByIdForUser } from "@/lib/data/bookings";
import { getBookingFeedbackForUser } from "@/lib/data/feedback";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Booking detail"
        title={booking.itemDescription}
        description="Track fulfilment, confirm receipt, review the job, or raise a dispute with an evidence trail."
      />

      <Card className="p-4">
        <div className="space-y-3">
          <p className="section-label">Status</p>
          <BookingStatusStepper status={booking.status} />
          <p className="subtle-text">
            Customer total {formatCurrency(booking.pricing.totalPriceCents)}.
          </p>
          {booking.status === "pending" && booking.createdAt ? (
            <PendingExpiryCountdown createdAt={booking.createdAt} />
          ) : null}
          {booking.status === "pending" && booking.paymentStatus === "pending" ? (
            <p className="subtle-text">
              Payment setup is still waiting on Stripe confirmation. Your booking request is saved,
              but the card authorization has not cleared yet.
            </p>
          ) : null}
          {booking.pickupProofPhotoUrl ? (
            <p className="subtle-text">Pickup proof saved for ops review.</p>
          ) : null}
          {booking.deliveryProofPhotoUrl ? (
            <p className="subtle-text">Delivery proof saved for ops review.</p>
          ) : null}
          {booking.status === "delivered" ? (
            <ConfirmReceiptButton bookingId={booking.id} />
          ) : null}
        </div>
      </Card>

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
    </main>
  );
}
