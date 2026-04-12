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
import type {
  BookingDeliveryProof,
  BookingExceptionReport,
  BookingPickupProof,
} from "@/types/booking";

function getBookingEventTimestamp(booking: { events?: Array<{ eventType: string; createdAt: string }> }, eventType: string) {
  return booking.events?.find((event) => event.eventType === eventType)?.createdAt ?? null;
}

function getEventSummaryLines(event: {
  eventType: string;
  metadata: Record<string, unknown>;
}) {
  if (
    event.eventType === "status_picked_up" &&
    event.metadata.pickupProof &&
    typeof event.metadata.pickupProof === "object"
  ) {
    const proof = event.metadata.pickupProof as BookingPickupProof;
    return [
      `${proof.itemCount} item${proof.itemCount === 1 ? "" : "s"} recorded at pickup.`,
      `Condition noted as ${proof.condition.replaceAll("_", " ")}.`,
    ];
  }

  if (
    event.eventType === "status_delivered" &&
    event.metadata.deliveryProof &&
    typeof event.metadata.deliveryProof === "object"
  ) {
    const proof = event.metadata.deliveryProof as BookingDeliveryProof;
    const lines = ["Recipient handoff confirmed in-app."];

    if (proof.exceptionCode && proof.exceptionCode !== "none") {
      lines.push(`Delivery exception noted as ${proof.exceptionCode.replaceAll("_", " ")}.`);
    }

    if (proof.exceptionNote) {
      lines.push(proof.exceptionNote);
    }

    return lines;
  }

  if (event.eventType === "exception_reported") {
    const exception = event.metadata as Partial<BookingExceptionReport>;

    if (!exception.code || !exception.note) {
      return [];
    }

    return [
      `Exception logged: ${String(exception.code).replaceAll("_", " ")}.`,
      String(exception.note),
    ];
  }

  return [];
}

function getNextAction(booking: NonNullable<Awaited<ReturnType<typeof getBookingByIdForUser>>>) {
  if (booking.status === "pending") {
    return "Your request is still with the carrier. Keep access details ready and watch this response window instead of reaching out off-platform.";
  }

  if (booking.status === "confirmed") {
    return "Keep access details ready and use this booking record for operational updates rather than side-channel negotiation.";
  }

  if (booking.status === "delivered") {
    return "Review the delivery proof, then confirm receipt so payout can be released.";
  }

  if (booking.status === "disputed") {
    return "Add evidence through the dispute flow so support can review the proof trail, timing, and payment state together.";
  }

  return "Use the booking timeline and proof gallery as the source of truth if anything needs review.";
}

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
  const pickupProofAt = getBookingEventTimestamp(booking, "status_picked_up");
  const deliveredAt = getBookingEventTimestamp(booking, "status_delivered");
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
        description="Track the request, fulfilment, payment, and proof in one on-platform record from first response through completion."
      />

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Status</p>
            <p className="mt-1 text-sm text-text-secondary">{booking.itemDescription}</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
            <p className="text-sm font-medium text-text">Next action</p>
            <p className="mt-1 text-sm text-text-secondary">{getNextAction(booking)}</p>
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

      {["confirmed", "picked_up", "in_transit"].includes(booking.status) && booking.carrierBusinessName ? (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">Privacy boundary</p>
              <h2 className="mt-1 text-lg text-text">Keep coordination inside moverrr</h2>
            </div>
            {booking.carrierBusinessName ? (
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm text-text-secondary">Business</p>
                <p className="mt-1 text-sm text-text">{booking.carrierBusinessName}</p>
              </div>
            ) : null}
            <p className="text-sm text-text-secondary">
              Address details, proof, support, and any dispute handling stay on-platform. Use this booking record as the source of truth for day-of-job coordination.
            </p>
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
                subtitle={pickupProofAt ? `Uploaded at ${formatDateTime(pickupProofAt)}` : undefined}
              />
              <PrivateProofTile
                bucket={PRIVATE_BUCKETS.proofPhotos}
                path={booking.deliveryProofPhotoUrl}
                title="Delivery proof"
                subtitle={deliveredAt ? `Uploaded at ${formatDateTime(deliveredAt)}` : undefined}
              />
            </div>
          </div>
        </Card>
      ) : null}

      {booking.events && booking.events.length > 0 ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Timeline</p>
              <h2 className="mt-1 text-lg text-text">Booking state history</h2>
            </div>
            <details className="rounded-xl border border-border p-3">
              <summary className="min-h-[44px] cursor-pointer list-none text-sm font-medium text-text active:opacity-80 [&::-webkit-details-marker]:hidden">
                View all booking events
              </summary>
              <div className="mt-4 space-y-3">
                {booking.events
                  .slice()
                  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                  .map((event) => {
                    const summaryLines = getEventSummaryLines(event);

                    return (
                      <div key={event.id} className="rounded-xl border border-border px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-text">
                            {event.eventType.replaceAll("_", " ")}
                          </p>
                          <p className="text-xs text-text-secondary">{formatDateTime(event.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-secondary">
                          {event.actorRole}
                        </p>
                        {summaryLines.length > 0 ? (
                          <div className="mt-2 space-y-1 text-sm text-text-secondary">
                            {summaryLines.map((line) => (
                              <p key={`${event.id}:${line}`}>{line}</p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </details>
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
          {["delivered", "completed", "disputed"].includes(booking.status) ? (
            <DisputeForm bookingId={booking.id} />
          ) : (
            <p className="subtle-text">
              Disputes can only be raised after the booking has been delivered or completed.
            </p>
          )}
          <a
            href={`mailto:hello@moverrr.com.au?subject=${encodeURIComponent(`Safety concern for booking ${booking.bookingReference}`)}`}
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-accent"
          >
            Report scam or safety concern
          </a>
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
