import Link from "next/link";
import { notFound } from "next/navigation";

import { CarrierRequestDetailView } from "@/components/carrier/carrier-request-detail-view";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingRequestByIdForCarrier } from "@/lib/data/booking-requests";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { getOfferByIdForAdmin } from "@/lib/data/offers";
import { getMoveRequestByIdForAdmin } from "@/lib/data/move-requests";
import { getTripById } from "@/lib/data/trips";
import { getBookingRequestUrgencyLabel } from "@/lib/request-presenters";
import type { BookingRequest } from "@/types/booking-request";
import type { MoveRequest, Offer } from "@/types/move-request";

function getFitLabel(offer: Offer) {
  switch (offer.fitConfidence) {
    case "likely_fits":
      return "Likely fits";
    case "review_photos":
      return "Review photos";
    case "needs_approval":
      return "Needs approval";
    default:
      return "Check fit";
  }
}

function buildAccessSummary(moveRequest: MoveRequest) {
  const parts: string[] = [];

  if (moveRequest.needsStairs) {
    parts.push("stairs");
  }

  if (moveRequest.needsHelper) {
    parts.push("helper requested");
  }

  if (moveRequest.route.pickupAccessNotes || moveRequest.route.dropoffAccessNotes) {
    parts.push("access notes added");
  }

  return parts.length > 0 ? parts.join(" · ") : "Standard access";
}

function getTypeLabel(bookingRequest: BookingRequest) {
  return bookingRequest.requestGroupId ? "Fast Match" : "Request to Book";
}

export default async function CarrierRequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  const user = await requirePageSessionUser();
  const carrier = await getCarrierByUserId(user.id);

  if (!carrier) {
    notFound();
  }

  const bookingRequest = await getBookingRequestByIdForCarrier(carrier.id, params.requestId);

  if (!bookingRequest) {
    notFound();
  }

  const [moveRequest, offer, trip] = await Promise.all([
    getMoveRequestByIdForAdmin(bookingRequest.moveRequestId),
    getOfferByIdForAdmin(bookingRequest.offerId),
    getTripById(bookingRequest.listingId),
  ]);

  if (!moveRequest || !offer) {
    notFound();
  }

  if (trip && trip.carrier.id !== carrier.id) {
    notFound();
  }

  const request = {
    id: bookingRequest.id,
    moveRequestId: bookingRequest.moveRequestId,
    offerId: bookingRequest.offerId,
    listingId: bookingRequest.listingId,
    bookingId: bookingRequest.bookingId ?? null,
    requestGroupId: bookingRequest.requestGroupId ?? null,
    status: bookingRequest.status,
    itemDescription: moveRequest.item.description,
    itemCategory: moveRequest.item.category,
    pickupAddress: moveRequest.route.pickupAddress,
    dropoffAddress: moveRequest.route.dropoffAddress,
    pickupSuburb: moveRequest.route.pickupSuburb,
    dropoffSuburb: moveRequest.route.dropoffSuburb,
    preferredDate: moveRequest.route.preferredDate ?? null,
    requestedTotalPriceCents: bookingRequest.requestedTotalPriceCents,
    carrierPayoutCents: offer.pricing.carrierPayoutCents,
    responseDeadlineAt: bookingRequest.responseDeadlineAt,
    urgencyLabel: getBookingRequestUrgencyLabel(bookingRequest.responseDeadlineAt),
    fitLabel: getFitLabel(offer),
    fitExplanation: offer.matchExplanation,
    accessSummary: buildAccessSummary(moveRequest),
    photoCount: moveRequest.item.photoUrls.length,
    photoUrls: moveRequest.item.photoUrls,
    declineReason: null,
    clarificationReason: bookingRequest.clarificationReason ?? null,
    clarificationMessage: bookingRequest.clarificationMessage ?? null,
    typeLabel: getTypeLabel(bookingRequest),
  };

  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="Request detail"
        title="Review one request with full route context"
        description="Fit, payout, clarification, and booking conversion all stay visible here so a single decision never loses its operational context."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/carrier/requests">Back to requests</Link>
            </Button>
            {trip ? (
              <Button asChild>
                <Link href={`/carrier/trips/${trip.id}`}>Open trip</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <CarrierRequestDetailView
        request={request}
        bookingRequest={bookingRequest}
        moveRequest={moveRequest}
        offer={offer}
        trip={trip}
      />
    </main>
  );
}
