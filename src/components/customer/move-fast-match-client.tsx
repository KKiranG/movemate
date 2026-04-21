"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createFastMatchRequest,
  fetchLiveOffersForMoveRequest,
  getCustomerMoveRequestLoginHref,
  type LiveMoveOfferResponse,
} from "@/components/customer/move-live-data";
import {
  draftFromMoveRequest,
  getMoveRequestOfferHref,
  getMoveRequestResultsHref,
  readMoveRequestDraft,
} from "@/components/customer/move-request-draft";
import { useMoveRequestDraft } from "@/components/customer/use-move-request-draft";
import { TopAppBar } from "@/components/spec/chrome";
import { TripCard } from "@/components/trip/trip-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ITEM_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type FastMatchState = "loading" | "ready" | "error" | "auth_required" | "missing";

export function MoveFastMatchClient({
  isAuthenticated,
  initialMoveRequestId,
}: {
  isAuthenticated: boolean;
  initialMoveRequestId?: string | null;
}) {
  const { setDraft, isHydrated } = useMoveRequestDraft();
  const [state, setState] = useState<FastMatchState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [data, setData] = useState<LiveMoveOfferResponse | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    async function loadFastMatchContext() {
      if (!isAuthenticated) {
        setState("auth_required");
        setMessage("Log in to start Fast Match for this move request.");
        return;
      }

      const storedDraft = readMoveRequestDraft();
      const moveRequestId = initialMoveRequestId ?? storedDraft.persistedMoveRequestId;

      if (!moveRequestId) {
        setState("missing");
        setMessage("Fast Match needs an active move request. Start from live results first.");
        return;
      }

      const liveData = await fetchLiveOffersForMoveRequest(moveRequestId);

      if (cancelled) {
        return;
      }

      setDraft(draftFromMoveRequest(liveData.moveRequest));
      setData(liveData);
      setState("ready");
      setMessage(null);
    }

    loadFastMatchContext().catch((error) => {
      if (cancelled) {
        return;
      }

      const nextMessage =
        error instanceof Error ? error.message : "Unable to load Fast Match.";

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
  }, [initialMoveRequestId, isAuthenticated, isHydrated, setDraft]);

  const moveRequestId = data?.moveRequest.id ?? initialMoveRequestId ?? null;
  const resultsHref = getMoveRequestResultsHref(moveRequestId);
  const loginHref = getCustomerMoveRequestLoginHref({
    pathname: "/move/new/fastmatch",
    moveRequestId,
  });

  async function handleStartFastMatch() {
    if (!data || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await createFastMatchRequest(data.moveRequest.id);
      setSuccessCount(result.bookingRequests.length);
      setDraft(draftFromMoveRequest(result.moveRequest));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start Fast Match.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (state === "loading") {
    return (
      <main className="pb-28">
        <TopAppBar title="Fast Match" backHref={resultsHref} />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">Loading Fast Match</p>
            <h1 className="mt-1 text-lg text-text">Checking the best live carriers for this move</h1>
            <p className="mt-2 text-sm text-text-secondary">
              MoveMate is reviewing the current ranked offers so Fast Match can stay explicit and
              bounded.
            </p>
          </Card>
        </section>
      </main>
    );
  }

  if (state === "auth_required") {
    return (
      <main className="pb-28">
        <TopAppBar title="Fast Match" backHref={resultsHref} />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">Log in first</p>
            <h1 className="mt-1 text-lg text-text">Start Fast Match after sign-in</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ?? "Your move draft stays on this device while you sign in."}
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
        <TopAppBar title="Fast Match" backHref={resultsHref} />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">{state === "missing" ? "Missing move request" : "Could not load Fast Match"}</p>
            <h1 className="mt-1 text-lg text-text">
              {state === "missing"
                ? "Start from live results so Fast Match knows which move to use"
                : "Something blocked Fast Match from loading"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ?? "Go back to the results list and try again."}
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

  const topOffers = data.offers.slice(0, 3);

  if (successCount !== null) {
    return (
      <main className="pb-28">
        <TopAppBar title="Fast Match" backHref={resultsHref} />
        <section className="screen space-y-4">
          <Card className="border-success/20 bg-success/5 p-4">
            <p className="section-label">Fast Match started</p>
            <h1 className="mt-1 text-lg text-text">MoveMate is now asking the next-best carriers</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Fast Match opened {successCount} live request{successCount === 1 ? "" : "s"} for
              this move and will close the rest as soon as one carrier accepts.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/bookings">Track requests</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={resultsHref}>Back to live results</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="pb-28">
      <TopAppBar title="Fast Match" backHref={resultsHref} />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">First accept wins</p>
          <h1 className="heading">Ask up to three matching carriers at once</h1>
          <p className="body text-[var(--text-secondary)]">
            Fast Match keeps the request explicit. It is not bidding, and it does not create a free-form negotiation thread.
          </p>
        </div>

        <Card className="p-4">
          <p className="section-label">Move summary</p>
          <div className="mt-3 grid gap-2 text-sm text-text-secondary">
            <p className="text-text">
              {data.moveRequest.route.pickupSuburb} to {data.moveRequest.route.dropoffSuburb}
            </p>
            <p>{data.moveRequest.item.description}</p>
            <p>
              {ITEM_CATEGORY_LABELS[data.moveRequest.item.category]}
              {data.moveRequest.route.preferredDate
                ? ` · ${formatDate(data.moveRequest.route.preferredDate)}`
                : " · Flexible date"}
            </p>
            <p>
              {data.moveRequest.needsStairs ? "Stairs flagged" : "No stairs"} ·{" "}
              {data.moveRequest.needsHelper ? "Helper requested" : "No helper"}
            </p>
          </div>
        </Card>

        <Card className="border-accent/15 bg-accent/5 p-4">
          <p className="section-label">How Fast Match behaves</p>
          <div className="mt-3 space-y-2 text-sm text-text-secondary">
            <p>1. MoveMate sends this move request to the next-best current carriers for the corridor.</p>
            <p>2. The price stays all-in and explicit for the customer path.</p>
            <p>3. As soon as one carrier accepts, the rest are closed so the move does not branch into parallel negotiation.</p>
          </div>
        </Card>

        <section className="space-y-3">
          <div className="space-y-1">
            <p className="section-label">Likely carriers</p>
            <p className="text-sm text-text-secondary">
              These are the top live route fits Fast Match will consider first.
            </p>
          </div>
          <div className="space-y-3">
            {topOffers.map(({ offer, trip }) => (
              <div key={offer.id} className="space-y-2">
                <TripCard
                  trip={trip}
                  preferredDate={data.moveRequest.route.preferredDate ?? undefined}
                  href={getMoveRequestOfferHref({
                    offerId: offer.id,
                    moveRequestId: data.moveRequest.id,
                  })}
                />
                <p className="px-1 text-sm text-text-secondary">{offer.matchExplanation}</p>
              </div>
            ))}
          </div>
        </section>

        {message ? <p className="text-sm text-error">{message}</p> : null}

        <div className="sticky-cta">
          <Button
            type="button"
            onClick={handleStartFastMatch}
            disabled={isSubmitting || topOffers.length === 0}
            className="w-full"
          >
            {isSubmitting ? "Starting Fast Match..." : "Start Fast Match"}
          </Button>
        </div>
      </section>
    </main>
  );
}
