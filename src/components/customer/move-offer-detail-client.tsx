"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BookingCheckoutPanel } from "@/components/booking/booking-checkout-panel";
import {
  fetchLiveOffersForMoveRequest,
  getCheckoutOfferId,
  getCustomerMoveRequestLoginHref,
  type LiveMoveOfferResponse,
} from "@/components/customer/move-live-data";
import {
  draftFromMoveRequest,
  getMoveRequestResultsHref,
  readMoveRequestDraft,
} from "@/components/customer/move-request-draft";
import { useMoveRequestDraft } from "@/components/customer/use-move-request-draft";
import { TopAppBar } from "@/components/spec/chrome";
import { TripDetailSummary } from "@/components/trip/trip-detail-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CustomerPaymentProfile } from "@/lib/data/customer-payments";

type DetailState = "loading" | "ready" | "error" | "auth_required" | "missing";

export function MoveOfferDetailClient({
  offerId,
  isAuthenticated,
  initialMoveRequestId,
  customerPaymentProfile,
}: {
  offerId: string;
  isAuthenticated: boolean;
  initialMoveRequestId?: string | null;
  customerPaymentProfile?: CustomerPaymentProfile | null;
}) {
  const { setDraft, isHydrated } = useMoveRequestDraft();
  const [state, setState] = useState<DetailState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<LiveMoveOfferResponse | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    async function loadOffer() {
      if (!isAuthenticated) {
        setState("auth_required");
        setMessage("Log in to review this live offer and keep the request flow in-platform.");
        return;
      }

      const storedDraft = readMoveRequestDraft();
      const moveRequestId = initialMoveRequestId ?? storedDraft.persistedMoveRequestId;

      if (!moveRequestId) {
        setState("missing");
        setMessage("This offer needs an active move request context. Start from live results first.");
        return;
      }

      const liveData = await fetchLiveOffersForMoveRequest(moveRequestId);
      const selectedOffer = liveData.offers.find((entry) => entry.offer.id === offerId);

      if (!selectedOffer) {
        setState("missing");
        setMessage("That offer is no longer available for this move request.");
        return;
      }

      if (cancelled) {
        return;
      }

      setDraft(draftFromMoveRequest(liveData.moveRequest));
      setData(liveData);
      setState("ready");
      setMessage(null);
    }

    loadOffer().catch((error) => {
      if (cancelled) {
        return;
      }

      const nextMessage =
        error instanceof Error ? error.message : "Unable to load this live offer.";

      if (nextMessage.toLowerCase().includes("log in") || nextMessage.toLowerCase().includes("unauthorized")) {
        setState("auth_required");
      } else {
        setState("error");
      }

      setMessage(nextMessage);
    });

    return () => {
      cancelled = true;
    };
  }, [initialMoveRequestId, isAuthenticated, isHydrated, offerId, setDraft]);

  const moveRequestId = data?.moveRequest.id ?? initialMoveRequestId ?? null;
  const resultsHref = getMoveRequestResultsHref(moveRequestId);
  const loginHref = getCustomerMoveRequestLoginHref({
    pathname: `/move/new/results/${offerId}`,
    moveRequestId,
  });

  if (state === "loading") {
    return (
      <main className="pb-28">
        <TopAppBar title="Offer detail" backHref={resultsHref} />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">Loading offer</p>
            <h1 className="mt-1 text-lg text-text">Pulling the latest trip and pricing details</h1>
            <p className="mt-2 text-sm text-text-secondary">
              MoveMate is checking the live listing behind this move request so the all-in price and
              route story stay current.
            </p>
          </Card>
        </section>
      </main>
    );
  }

  if (state === "auth_required") {
    return (
      <main className="pb-28">
        <TopAppBar title="Offer detail" backHref={resultsHref} />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">Log in first</p>
            <h1 className="mt-1 text-lg text-text">Review the real trip after sign-in</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ??
                "Sign in to keep the move request, request-to-book path, and trust boundaries tied to your account."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={loginHref}>Log in to continue</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={resultsHref}>Back to results</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  if (state === "error" || state === "missing" || !data) {
    return (
      <main className="pb-28">
        <TopAppBar title="Offer detail" backHref={resultsHref} />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">{state === "missing" ? "Offer unavailable" : "Could not load offer"}</p>
            <h1 className="mt-1 text-lg text-text">
              {state === "missing"
                ? "This selection is no longer attached to the current move request"
                : "We hit a problem while loading the live trip"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ?? "Go back to the live results list and choose another route fit."}
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href={resultsHref}>Back to live results</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const selected = data.offers.find((entry) => entry.offer.id === offerId);

  if (!selected) {
    return null;
  }

  return (
    <main className="pb-28">
      <TopAppBar title={null} backHref={resultsHref} />

      <section className="screen space-y-4">
        <TripDetailSummary
          trip={selected.trip}
          preferredDate={data.moveRequest.route.preferredDate ?? undefined}
          matchExplanation={selected.offer.matchExplanation}
        />

        <BookingCheckoutPanel
          trip={selected.trip}
          isAuthenticated={isAuthenticated}
          existingMoveRequest={data.moveRequest}
          initialOfferId={getCheckoutOfferId(selected.offer)}
          customerPaymentProfile={customerPaymentProfile}
          requestMode="single"
        />
      </section>
    </main>
  );
}
