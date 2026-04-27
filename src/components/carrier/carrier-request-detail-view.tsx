import Link from "next/link";

import { PendingBookingsAlert } from "@/components/carrier/pending-bookings-alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildBookingRequestTimeline, getBookingRequestOutcomeCopy } from "@/lib/request-presenters";
import { formatCurrency, formatDate, formatDateTime, formatLongDate } from "@/lib/utils";
import type { BookingRequest } from "@/types/booking-request";
import type { CarrierRequestCard } from "@/types/carrier";
import type { MoveRequest, Offer } from "@/types/move-request";
import type { Trip } from "@/types/trip";

type RequestDetailCard = Omit<CarrierRequestCard, "status"> & {
  status: BookingRequest["status"];
};

function formatRequestStatus(status: BookingRequest["status"]) {
  return status.replaceAll("_", " ");
}

function toActionableRequest(request: RequestDetailCard): CarrierRequestCard | null {
  if (request.status !== "pending" && request.status !== "clarification_requested") {
    return null;
  }

  return request as CarrierRequestCard;
}

export function CarrierRequestDetailView({
  request,
  bookingRequest,
  moveRequest,
  offer,
  trip,
}: {
  request: RequestDetailCard;
  bookingRequest: BookingRequest;
  moveRequest: MoveRequest;
  offer: Offer;
  trip?: Trip | null;
}) {
  const timeline = buildBookingRequestTimeline(bookingRequest, []);
  const outcomeCopy = getBookingRequestOutcomeCopy(bookingRequest.status, request.typeLabel);
  const actionableRequest = toActionableRequest(request);

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div>
              <p className="section-label">Request summary</p>
              <h2 className="mt-1 text-lg text-text">{request.itemDescription}</h2>
              <p className="mt-2 text-sm text-text-secondary">
                {request.pickupAddress} to {request.dropoffAddress}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
                <span className="rounded-full border border-border px-3 py-1 capitalize">
                  {formatRequestStatus(bookingRequest.status)}
                </span>
                <span className="rounded-full border border-border px-3 py-1">{request.typeLabel}</span>
                <span className="rounded-full border border-border px-3 py-1">{request.fitLabel}</span>
                {request.urgencyLabel ? (
                  <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-warning">
                    {request.urgencyLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Requested total</p>
                <p className="mt-2 text-base font-medium text-text">
                  {formatCurrency(request.requestedTotalPriceCents)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Carrier payout {formatCurrency(request.carrierPayoutCents)}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Decision window</p>
                <p className="mt-2 text-base font-medium text-text">
                  {formatDateTime(request.responseDeadlineAt)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Preferred date {request.preferredDate ? formatLongDate(request.preferredDate) : "Flexible"}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Fit and access</p>
                <p className="mt-2 text-sm text-text">{request.fitExplanation}</p>
                <p className="mt-2 text-sm text-text-secondary">{request.accessSummary}</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Request timing</p>
                <p className="mt-2 text-sm text-text">Submitted {formatDateTime(bookingRequest.createdAt)}</p>
                {bookingRequest.respondedAt ? (
                  <p className="mt-1 text-sm text-text-secondary">
                    Responded {formatDateTime(bookingRequest.respondedAt)}
                  </p>
                ) : null}
                {bookingRequest.clarificationMessage ? (
                  <p className="mt-2 text-sm text-text-secondary">
                    Clarification asked: {bookingRequest.clarificationMessage}
                  </p>
                ) : null}
                {bookingRequest.customerResponse ? (
                  <p className="mt-2 text-sm text-text-secondary">
                    Customer reply: {bookingRequest.customerResponse}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Offer math</p>
              <div className="mt-3 grid gap-2 text-sm text-text-secondary">
                <p>Base route price: {formatCurrency(offer.pricing.basePriceCents)}</p>
                <p>Stairs add-on: {formatCurrency(offer.pricing.stairsFeeCents)}</p>
                <p>Second mover add-on: {formatCurrency(offer.pricing.secondMoverFeeCents)}</p>
                <p>Platform fee: {formatCurrency(offer.pricing.platformFeeCents)}</p>
                <p>GST: {formatCurrency(offer.pricing.gstCents)}</p>
              </div>
            </div>

            {trip ? (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Matched trip</p>
                <p className="mt-2 text-sm font-medium text-text">{trip.route.label}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {formatDate(trip.tripDate)} · {trip.timeWindow} · Remaining {trip.remainingCapacityPct}%
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-3">
                  <Link href={`/carrier/trips/${trip.id}`}>Open trip</Link>
                </Button>
              </div>
            ) : null}

            {outcomeCopy ? (
              <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
                <p className="text-sm font-medium text-text">Outcome</p>
                <p className="mt-2 text-sm text-text-secondary">{outcomeCopy}</p>
                {bookingRequest.bookingId ? (
                  <Button asChild variant="secondary" size="sm" className="mt-3">
                    <Link href={`/carrier/trips/${request.listingId}?focus=${bookingRequest.bookingId}#booking-${bookingRequest.bookingId}`}>
                      Open linked booking
                    </Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {actionableRequest ? (
        <PendingBookingsAlert requests={[actionableRequest]} compact />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Item and route context</p>
              <h2 className="mt-1 text-lg text-text">What the customer asked the trip to carry</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Item details</p>
                <p className="mt-2 text-sm text-text capitalize">{moveRequest.item.category}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Size {moveRequest.item.sizeClass ?? "Not supplied"} · Weight band {moveRequest.item.weightBand ?? "Not supplied"}
                </p>
                {moveRequest.item.dimensions ? (
                  <p className="mt-1 text-sm text-text-secondary">Dimensions {moveRequest.item.dimensions}</p>
                ) : null}
                {moveRequest.item.weightKg ? (
                  <p className="mt-1 text-sm text-text-secondary">Approx. {moveRequest.item.weightKg}kg</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Access notes</p>
                <p className="mt-2 text-sm text-text-secondary">
                  Pickup: {moveRequest.route.pickupAccessNotes ?? "No extra pickup notes"}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Dropoff: {moveRequest.route.dropoffAccessNotes ?? "No extra dropoff notes"}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Needs stairs: {moveRequest.needsStairs ? "Yes" : "No"} · Helper requested: {moveRequest.needsHelper ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {moveRequest.specialInstructions ? (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Customer instructions</p>
                <p className="mt-2 text-sm text-text-secondary">{moveRequest.specialInstructions}</p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              {request.photoUrls.map((photoUrl, index) => (
                <a
                  key={`${photoUrl}:${index}`}
                  href={photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-xl border border-border"
                >
                  {/* External proof and item-photo URLs are not guaranteed to be whitelisted for next/image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt={`Request photo ${index + 1}`}
                    className="h-44 w-full object-cover"
                  />
                </a>
              ))}
              {request.photoUrls.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4">
                  <p className="text-sm text-text-secondary">No item photos were attached to this request.</p>
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Decision trail</p>
              <h2 className="mt-1 text-lg text-text">Keep the request history visible</h2>
            </div>
            <div className="grid gap-3">
              {timeline.map((entry) => (
                <div key={entry.key} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-text">{entry.title}</p>
                  <p className="mt-1 text-xs text-text-secondary">{formatDateTime(entry.createdAt)}</p>
                  <p className="mt-2 text-sm text-text-secondary">{entry.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
