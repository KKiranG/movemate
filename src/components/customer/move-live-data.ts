import { draftFromMoveRequest, toMoveRequestInputFromDraft, type MoveRequestDraft } from "@/components/customer/move-request-draft";
import type { CustomerPaymentProfile } from "@/lib/data/customer-payments";
import type { MoveRequest, Offer } from "@/types/move-request";
import type { Trip } from "@/types/trip";

export interface LiveMoveOffer {
  offer: Offer;
  trip: Trip;
}

export interface LiveMoveOfferResponse {
  moveRequest: MoveRequest;
  offers: LiveMoveOffer[];
  source: string;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function parseJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string; code?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to complete this request.");
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload as T;
}

export async function createLiveMoveRequest(draft: MoveRequestDraft) {
  const payload = toMoveRequestInputFromDraft(draft);

  if (!payload) {
    throw new Error("Complete the route and item details before loading live matches.");
  }

  const response = await fetch("/api/move-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse<{ moveRequest: MoveRequest }>(response);

  return {
    moveRequest: data.moveRequest,
    nextDraft: draftFromMoveRequest(data.moveRequest),
  };
}

export async function fetchLiveOffersForMoveRequest(moveRequestId: string) {
  const offersResponse = await fetch(
    `/api/offers?moveRequestId=${encodeURIComponent(moveRequestId)}`,
    {
      cache: "no-store",
    },
  );
  const offerData = await parseJsonResponse<{
    moveRequest: MoveRequest;
    offers: Offer[];
    source: string;
  }>(offersResponse);

  const tripPayloads = await Promise.all(
    offerData.offers.map(async (offer) => {
      const tripResponse = await fetch(`/api/trips/${encodeURIComponent(offer.listingId)}`, {
        cache: "no-store",
      });

      const tripData = await parseJsonResponse<{ trip: Trip }>(tripResponse);

      return {
        offer,
        trip: tripData.trip,
      } satisfies LiveMoveOffer;
    }),
  );

  return {
    moveRequest: offerData.moveRequest,
    offers: tripPayloads,
    source: offerData.source,
  } satisfies LiveMoveOfferResponse;
}

export async function createFastMatchRequest(moveRequestId: string) {
  const response = await fetch("/api/booking-requests/fast-match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      moveRequestId,
    }),
  });

  return parseJsonResponse<{
    moveRequest: MoveRequest;
    bookingRequests: Array<{ id: string }>;
    requestGroupId: string;
  }>(response);
}

export async function createRequestToBookFromOffer(params: {
  moveRequestId: string;
  offerId?: string | null;
  listingId?: string | null;
}) {
  const response = await fetch("/api/booking-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      moveRequestId: params.moveRequestId,
      offerId: params.offerId ?? undefined,
      listingId: params.listingId ?? undefined,
    }),
  });

  return parseJsonResponse<{
    bookingRequest: { id: string; moveRequestId: string; offerId?: string | null; listingId: string };
  }>(response);
}

export async function createUnmatchedRequestFromMoveRequest(moveRequestId: string) {
  const response = await fetch("/api/unmatched-requests/from-move-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      moveRequestId,
    }),
  });

  return parseJsonResponse<{
    unmatchedRequest: { id: string; moveRequestId: string };
  }>(response);
}

export function getCustomerMoveRequestDetailHref(params: {
  offerId: string;
  moveRequestId?: string | null;
}) {
  const search = params.moveRequestId
    ? `?moveRequestId=${encodeURIComponent(params.moveRequestId)}`
    : "";

  return `/move/new/results/${encodeURIComponent(params.offerId)}${search}`;
}

export function getCustomerMoveRequestLoginHref(params: {
  pathname: string;
  moveRequestId?: string | null;
}) {
  const target = params.moveRequestId
    ? `${params.pathname}?moveRequestId=${encodeURIComponent(params.moveRequestId)}`
    : params.pathname;

  return `/login?next=${encodeURIComponent(target)}`;
}

export function getCheckoutOfferId(offer: Offer) {
  return isUuid(offer.id) ? offer.id : null;
}

export function hasSavedCard(paymentProfile?: CustomerPaymentProfile | null) {
  return Boolean(paymentProfile?.stripeConfigured && paymentProfile?.hasSavedPaymentMethod);
}
