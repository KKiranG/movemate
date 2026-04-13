import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingStatusStepper } from "@/components/booking/booking-status-stepper";
import { ConfirmReceiptButton } from "@/components/booking/confirm-receipt-button";
import { DisputeForm } from "@/components/booking/dispute-form";
import { PaymentRecoveryCard } from "@/components/booking/payment-recovery-card";
import { PendingExpiryCountdown } from "@/components/booking/pending-expiry-countdown";
import { PrintReceiptButton } from "@/components/booking/print-receipt-button";
import { PrivateProofTile } from "@/components/booking/private-proof-tile";
import { RequestClarificationResponseForm } from "@/components/booking/request-clarification-response-form";
import { ReviewForm } from "@/components/booking/review-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingPaymentStateSummary, getConfirmedBookingChecklist } from "@/lib/booking-presenters";
import { getBookingByIdForUser } from "@/lib/data/bookings";
import { listCustomerRequestCards } from "@/lib/data/booking-requests";
import { getBookingFeedbackForUser } from "@/lib/data/feedback";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type {
  Booking,
  BookingDeliveryProof,
  BookingExceptionReport,
  BookingPickupProof,
} from "@/types/booking";
import type { CustomerBookingRequestCard } from "@/types/booking-request";

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

function getBookingNextAction(booking: Booking) {
  if (booking.status === "pending") {
    return "The carrier already accepted and this booking is now in the live fulfilment queue. Keep access details ready and watch the booking record for the next operational update.";
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

function getClarificationReasonLabel(value: CustomerBookingRequestCard["clarificationReason"]) {
  switch (value) {
    case "item_details":
      return "Item details";
    case "access_details":
      return "Access details";
    case "timing":
      return "Timing";
    case "photos":
      return "Photos";
    case "other":
      return "Other";
    default:
      return "Clarification";
  }
}

function getRequestNextAction(request: CustomerBookingRequestCard) {
  if (request.status === "clarification_requested") {
    return "Reply once with the missing fact the carrier asked for. After that, moverrr pushes the request back into the final decision window.";
  }

  if (request.status === "pending") {
    return "The carrier is still reviewing fit, timing, and access details. Keep everything inside moverrr while the response window is open.";
  }

  if (request.status === "revoked") {
    return "Another Fast Match carrier accepted first, so this request automatically closed.";
  }

  if (request.status === "declined") {
    return "This carrier passed on the move. Use the next-best route or start a fresh request instead of reopening the same negotiation.";
  }

  if (request.status === "expired") {
    return "The response or clarification window ended before this request could turn into a live booking.";
  }

  return "This request is no longer waiting on a customer or carrier action.";
}

function RequestDetailPage({ request }: { request: CustomerBookingRequestCard }) {
  const restartHref = `/search?${new URLSearchParams({
    from: request.pickupSuburb,
    to: request.dropoffSuburb,
  }).toString()}`;
  const recoveryHref = request.recoveryAlertId ? "/alerts" : restartHref;
  const recoveryLabel = request.recoveryAlertId
    ? "Open recovery alerts"
    : request.requestGroupId
      ? "Search the route again"
      : "Find the next-best match";
  const clarificationDeadline = request.clarificationExpiresAt ?? request.responseDeadlineAt;
  const awaitingCustomerReply =
    request.status === "clarification_requested" &&
    !request.customerResponseAt &&
    Boolean(clarificationDeadline);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Request detail"
        title={request.typeLabel}
        description="Track the pre-acceptance decision flow here until a carrier accepts and moverrr turns it into a live booking."
      />

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Request status</p>
            <p className="mt-1 text-sm text-text-secondary">{request.itemDescription}</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
            <p className="text-sm font-medium text-text">Next action</p>
            <p className="mt-1 text-sm text-text-secondary">{getRequestNextAction(request)}</p>
          </div>
          <BookingStatusStepper requestStatus={request.status} />
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium text-text">
              {request.status === "clarification_requested"
                ? "Customer reply window"
                : "Carrier response window"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {request.status === "clarification_requested"
                ? `Reply by ${formatDateTime(clarificationDeadline)} so this request can move back into the final decision window.`
                : `Carrier decision due by ${formatDateTime(request.responseDeadlineAt)}.`}
            </p>
          </div>
          {request.status === "pending" ? (
            <PendingExpiryCountdown expiresAt={request.responseDeadlineAt} />
          ) : null}
          {request.status === "clarification_requested" && clarificationDeadline ? (
            <PendingExpiryCountdown expiresAt={clarificationDeadline} />
          ) : null}
          {request.status === "accepted" && request.bookingId ? (
            <Button asChild>
              <Link href={`/bookings/${request.bookingId}`}>Open live booking</Link>
            </Button>
          ) : null}
          {["declined", "expired", "revoked"].includes(request.status) ? (
            <Button asChild variant="secondary">
              <Link href={recoveryHref}>{recoveryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Request summary</p>
            <h2 className="mt-1 text-lg text-text">What the carrier is reviewing</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">{request.carrierBusinessName}</p>
              <p className="mt-2 text-sm text-text-secondary">{request.fitExplanation}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">
                {request.pickupSuburb} to {request.dropoffSuburb}
              </p>
              {request.preferredDate ? (
                <p className="mt-2 text-sm text-text-secondary">
                  Requested for {formatDate(request.preferredDate)}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-text-secondary">
                Customer total {formatCurrency(request.requestedTotalPriceCents)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {request.clarificationMessage ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Clarification trail</p>
              <h2 className="mt-1 text-lg text-text">One factual follow-up round</h2>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">
                Carrier asked about {getClarificationReasonLabel(request.clarificationReason)}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{request.clarificationMessage}</p>
              {request.clarificationRequestedAt ? (
                <p className="mt-2 text-xs text-text-secondary">
                  Asked on {formatDateTime(request.clarificationRequestedAt)}
                </p>
              ) : null}
            </div>
            {request.customerResponse ? (
              <div className="rounded-xl border border-success/20 bg-success/5 p-3">
                <p className="text-sm font-medium text-text">Your reply</p>
                <p className="mt-2 text-sm text-text-secondary">{request.customerResponse}</p>
                {request.customerResponseAt ? (
                  <p className="mt-2 text-xs text-text-secondary">
                    Sent on {formatDateTime(request.customerResponseAt)}
                  </p>
                ) : null}
              </div>
            ) : null}
            {awaitingCustomerReply ? (
              <RequestClarificationResponseForm bookingRequestId={request.id} />
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">What happens next</p>
            <h2 className="mt-1 text-lg text-text">Before this becomes a booking</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "1. moverrr keeps this request inside a bounded decision window instead of open-ended back-and-forth.",
              "2. The carrier can accept, decline, or ask for one factual clarification round only.",
              "3. If accepted, moverrr opens a live booking record with proof, support, and payout handling attached.",
              "4. If it expires or declines, use the next-best route instead of reopening the same request off-platform.",
            ].map((step) => (
              <p key={step} className="text-sm text-text-secondary">
                {step}
              </p>
            ))}
          </div>
        </div>
      </Card>
    </main>
  );
}

function BookingDetailPageContent({
  booking,
  feedback,
}: {
  booking: Booking;
  feedback: Awaited<ReturnType<typeof getBookingFeedbackForUser>>;
}) {
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
        description="Track the accepted booking, fulfilment, payment, and proof in one on-platform record from carrier acceptance through completion."
      />

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Status</p>
            <p className="mt-1 text-sm text-text-secondary">{booking.itemDescription}</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
            <p className="text-sm font-medium text-text">Next action</p>
            <p className="mt-1 text-sm text-text-secondary">{getBookingNextAction(booking)}</p>
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

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Support and disputes</p>
            <h2 className="mt-1 text-lg text-text">Use the right path for help</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">Booking support</p>
              <p className="mt-2 text-sm text-text-secondary">
                Keep proof, timing, and payment issues attached to this booking record so support
                sees the same evidence trail you do.
              </p>
              <div className="mt-3">
                <Button asChild variant="secondary" className="min-h-[44px] w-full">
                  <a href="mailto:hello@moverrr.com.au">Email support</a>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">Dispute path</p>
              <p className="mt-2 text-sm text-text-secondary">
                Raise a dispute with evidence inside moverrr if the handoff, timing, item, or
                payment outcome is wrong.
              </p>
              <div className="mt-3">
                <Button asChild variant="secondary" className="min-h-[44px] w-full">
                  <a href="#disputes">Open dispute section</a>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">Policies</p>
              <p className="mt-2 text-sm text-text-secondary">
                Review the platform rules that govern privacy, proof, payment, and dispute handling
                on this booking.
              </p>
              <div className="mt-3 grid gap-2">
                <Button asChild variant="secondary" className="min-h-[44px] w-full">
                  <Link href="/terms">Open terms</Link>
                </Button>
                <Button asChild variant="ghost" className="min-h-[44px] w-full">
                  <Link href="/privacy">Open privacy policy</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

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

      <Card id="disputes" className="p-4">
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
              </div>
            ))}
            {feedback.disputes.length === 0 ? (
              <p className="subtle-text">
                No disputes raised. Use the proof gallery and review flow if everything completed cleanly.
              </p>
            ) : null}
          </div>
          {["delivered", "completed", "disputed"].includes(booking.status) ? null : (
            <DisputeForm bookingId={booking.id} />
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <PrintReceiptButton />
      </div>
    </main>
  );
}

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requirePageSessionUser();
  const [booking, requestCards] = await Promise.all([
    getBookingByIdForUser(user.id, params.id),
    listCustomerRequestCards(user.id),
  ]);

  if (!booking) {
    const request = requestCards.find((entry) => entry.id === params.id);

    if (!request) {
      notFound();
    }

    return <RequestDetailPage request={request} />;
  }

  const feedback = await getBookingFeedbackForUser(user.id, params.id);
  return <BookingDetailPageContent booking={booking} feedback={feedback} />;
}
