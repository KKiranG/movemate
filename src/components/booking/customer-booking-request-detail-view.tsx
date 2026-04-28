import Link from "next/link";

import { BookingRequestTimeline } from "@/components/booking/booking-request-timeline";
import { BookingStatusStepper } from "@/components/booking/booking-status-stepper";
import { CancelBookingRequestButton } from "@/components/booking/cancel-booking-request-button";
import { RequestClarificationResponseForm } from "@/components/booking/request-clarification-response-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CustomerBookingRequestDetailData } from "@/lib/data/customer-booking-detail";
import {
  buildBookingRequestTimeline,
  getBookingRequestOutcomeCopy,
} from "@/lib/request-presenters";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

function getRequestHeadline(detail: CustomerBookingRequestDetailData) {
  switch (detail.bookingRequest.status) {
    case "clarification_requested":
      return {
        eyebrow: "Clarification needed",
        title: "Reply with the missing fact so the request can keep moving",
        description:
          "MoveMate allows one factual clarification round only. Keep the answer specific and on-platform so the trust trail stays intact.",
      };
    case "pending":
      return {
        eyebrow: "Awaiting carrier decision",
        title: "This request is still inside the response window",
        description:
          "The carrier is reviewing fit, access, timing, and proof expectations on this same route-fit request.",
      };
    case "accepted":
      return {
        eyebrow: "Accepted",
        title: "This request converted into a live booking",
        description:
          "Use the booking record from here forward for proof, delivery, payout-release, and any dispute handling.",
      };
    default:
      return {
        eyebrow: "Request outcome",
        title: "This request has closed",
        description:
          getBookingRequestOutcomeCopy(
            detail.bookingRequest.status,
            detail.bookingRequest.requestGroupId ? "Fast Match" : "Request to Book",
          ) ?? "This request is no longer active.",
      };
  }
}

export function CustomerBookingRequestDetailView({
  detail,
}: {
  detail: CustomerBookingRequestDetailData;
}) {
  const { bookingRequest, moveRequest, offer, trip, timeline, groupSummary } = detail;
  const headline = getRequestHeadline(detail);
  const requestTimeline = buildBookingRequestTimeline(bookingRequest, timeline);
  const typeLabel = bookingRequest.requestGroupId ? "Fast Match" : "Request to Book";
  const canCancel = ["pending", "clarification_requested"].includes(bookingRequest.status);
  const clarificationActive = bookingRequest.status === "clarification_requested";

  return (
    <main
      id="main-content"
      className="screen safe-bottom-pad space-y-4 pb-[calc(104px+env(safe-area-inset-bottom))]"
    >
      <PageIntro
        eyebrow="Request detail"
        title={moveRequest.item.description}
        description="Track the pre-acceptance decision path until it converts into a live booking or closes cleanly."
        actions={
          <Button asChild variant="secondary">
            <Link href="/bookings">Back to bookings</Link>
          </Button>
        }
      />

      <Card className="border-warning/20 bg-warning/10 p-4">
        <div className="space-y-3">
          <div>
            <p className="section-label">{headline.eyebrow}</p>
            <h2 className="mt-1 text-lg text-text">{headline.title}</h2>
            <p className="mt-2 text-sm text-text-secondary">{headline.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            <span className="rounded-full border border-border px-3 py-1 capitalize">
              {bookingRequest.status.replaceAll("_", " ")}
            </span>
            <span className="rounded-full border border-border px-3 py-1">{typeLabel}</span>
            {trip ? (
              <span className="rounded-full border border-border px-3 py-1">
                {trip.carrier.businessName}
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Request status</p>
                <h2 className="mt-1 text-lg text-text">One request, one visible decision trail</h2>
              </div>
              <BookingStatusStepper requestStatus={bookingRequest.status} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Requested total</p>
                  <p className="mt-2 text-base font-medium text-text">
                    {formatCurrency(bookingRequest.requestedTotalPriceCents)}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Carrier payout {formatCurrency(offer.pricing.carrierPayoutCents)}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Decision timing</p>
                  <p className="mt-2 text-sm text-text">
                    Submitted {formatDateTime(bookingRequest.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Response window {formatDateTime(bookingRequest.responseDeadlineAt)}
                  </p>
                  {bookingRequest.clarificationExpiresAt ? (
                    <p className="mt-1 text-sm text-text-secondary">
                      Clarification reply due {formatDateTime(bookingRequest.clarificationExpiresAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Route and fit</p>
                <h2 className="mt-1 text-lg text-text">Why this carrier saw the request</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Route</p>
                  <p className="mt-2 text-sm text-text">
                    {moveRequest.route.pickupAddress}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    to {moveRequest.route.dropoffAddress}
                  </p>
                  {moveRequest.route.preferredDate ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Preferred date {formatDate(moveRequest.route.preferredDate)}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Fit explanation</p>
                  <p className="mt-2 text-sm text-text-secondary">{offer.matchExplanation}</p>
                  {trip ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Matched trip: {trip.route.label} · {trip.timeWindow}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Item and access</p>
                  <p className="mt-2 text-sm text-text capitalize">{moveRequest.item.category}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Stairs pickup: {moveRequest.stairsLevelPickup} · Stairs drop-off: {moveRequest.stairsLevelDropoff} · Movers: {moveRequest.customerMoverPreference === "two_movers" ? "Two movers" : moveRequest.customerMoverPreference === "customer_help" ? "Customer helps" : "One mover"}
                  </p>
                  {moveRequest.route.pickupAccessNotes ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Pickup notes: {moveRequest.route.pickupAccessNotes}
                    </p>
                  ) : null}
                  {moveRequest.route.dropoffAccessNotes ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Dropoff notes: {moveRequest.route.dropoffAccessNotes}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Pricing</p>
                  <p className="mt-2 text-sm text-text-secondary">
                    Base route price {formatCurrency(offer.pricing.basePriceCents)}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Platform fee {formatCurrency(offer.pricing.platformFeeCents)} · GST {formatCurrency(offer.pricing.gstCents)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {clarificationActive ? (
            <Card id="clarification-card" className="p-4">
              <div className="space-y-4">
                <div>
                  <p className="section-label">Clarification</p>
                  <h2 className="mt-1 text-lg text-text">Reply with the missing fact only</h2>
                </div>
                {bookingRequest.clarificationMessage ? (
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-sm text-text-secondary">{bookingRequest.clarificationMessage}</p>
                  </div>
                ) : null}
                <RequestClarificationResponseForm bookingRequestId={bookingRequest.id} />
              </div>
            </Card>
          ) : null}

          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Request timeline</p>
                <h2 className="mt-1 text-lg text-text">What happened in order</h2>
              </div>
              <BookingRequestTimeline entries={requestTimeline} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {bookingRequest.bookingId ? (
            <Card className="p-4">
              <div className="space-y-3">
                <p className="section-label">Live booking</p>
                <p className="text-sm text-text-secondary">
                  This request already converted into a booking. Continue from the booking record for proof and delivery.
                </p>
                <Button asChild>
                  <Link href={`/bookings/${bookingRequest.bookingId}`}>Open live booking</Link>
                </Button>
              </div>
            </Card>
          ) : null}

          {groupSummary ? (
            <Card className="p-4">
              <div className="space-y-3">
                <p className="section-label">Fast Match group</p>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Still live</p>
                    <p className="mt-2 text-sm text-text">{groupSummary.liveRequestCount}</p>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Closed in parallel</p>
                    <p className="mt-2 text-sm text-text">
                      {groupSummary.revokedCount + groupSummary.declinedCount + groupSummary.expiredCount}
                    </p>
                  </div>
                  {groupSummary.winningCarrierBusinessName ? (
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Winning carrier</p>
                      <p className="mt-2 text-sm text-text">{groupSummary.winningCarrierBusinessName}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          {canCancel ? (
            <Card className="p-4">
              <div className="space-y-3">
                <p className="section-label">Need to stop this request?</p>
                <p className="text-sm text-text-secondary">
                  Cancelling closes any still-open carrier decisions for this move request before acceptance.
                </p>
                <CancelBookingRequestButton bookingRequestId={bookingRequest.id} />
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {clarificationActive ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Clarification needed</p>
              <p className="truncate text-sm font-medium text-text">Reply inside MoveMate</p>
            </div>
            <Button asChild size="sm">
              <a href="#clarification-card">Reply now</a>
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
