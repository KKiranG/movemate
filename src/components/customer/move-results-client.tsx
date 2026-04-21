"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TripCard } from "@/components/trip/trip-card";
import {
  draftFromMoveRequest,
  getMoveRequestDraftFirstIncompleteStep,
  getMoveRequestFastMatchHref,
  getMoveRequestOfferHref,
  getMoveRequestResultsHref,
  isPersistedMoveRequestReusable,
  readMoveRequestDraft,
} from "@/components/customer/move-request-draft";
import { useMoveRequestDraft } from "@/components/customer/use-move-request-draft";
import {
  createLiveMoveRequest,
  fetchLiveOffersForMoveRequest,
  getCustomerMoveRequestLoginHref,
  type LiveMoveOffer,
  type LiveMoveOfferResponse,
} from "@/components/customer/move-live-data";
import { TopAppBar } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ITEM_CATEGORY_LABELS, TIME_WINDOW_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type LoadState =
  | "loading"
  | "creating"
  | "ready"
  | "error"
  | "auth_required"
  | "incomplete";

function splitOfferGroups(offers: LiveMoveOffer[]) {
  const nearbyDate = offers.filter((entry) => entry.offer.matchClass === "nearby_date");
  const needsReview = offers.filter(
    (entry) =>
      entry.offer.matchClass !== "nearby_date" &&
      entry.offer.fitConfidence === "needs_approval",
  );
  const topMatches = offers.filter(
    (entry) =>
      entry.offer.matchClass !== "nearby_date" &&
      entry.offer.fitConfidence !== "needs_approval",
  );

  return {
    topMatches,
    needsReview,
    nearbyDate,
  };
}

function getStepHref(step: ReturnType<typeof getMoveRequestDraftFirstIncompleteStep>) {
  switch (step) {
    case "item":
      return "/move/new#item";
    case "route":
    default:
      return "/move/new#route";
  }
}

function OfferSection({
  title,
  description,
  offers,
  moveRequestId,
  preferredDate,
}: {
  title: string;
  description: string;
  offers: LiveMoveOffer[];
  moveRequestId: string;
  preferredDate?: string;
}) {
  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <p className="section-label">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <div className="space-y-3">
        {offers.map(({ offer, trip }) => (
          <div key={offer.id} className="space-y-2">
            <TripCard
              trip={trip}
              preferredDate={preferredDate}
              href={getMoveRequestOfferHref({
                offerId: offer.id,
                moveRequestId,
              })}
            />
            <p className="px-1 text-sm text-text-secondary">{offer.matchExplanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MoveResultsClient({
  isAuthenticated,
  initialMoveRequestId,
}: {
  isAuthenticated: boolean;
  initialMoveRequestId?: string | null;
}) {
  const { setDraft, isHydrated } = useMoveRequestDraft();
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<LiveMoveOfferResponse | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    async function loadLiveResults() {
      if (!isAuthenticated) {
        setState("auth_required");
        setMessage("Log in to turn this move into a live request and see real spare-capacity matches.");
        return;
      }

      const storedDraft = readMoveRequestDraft();
      let moveRequestId = initialMoveRequestId ?? null;

      if (!moveRequestId) {
        const missingStep = getMoveRequestDraftFirstIncompleteStep(storedDraft);

        if (missingStep) {
          setState("incomplete");
          setMessage(
            missingStep === "route"
              ? "Add both addresses first so MoveMate can match the real corridor."
              : "Finish the item details before loading live route fits.",
          );
          return;
        }

        if (isPersistedMoveRequestReusable(storedDraft) && storedDraft.persistedMoveRequestId) {
          moveRequestId = storedDraft.persistedMoveRequestId;
        } else {
          setState("creating");
          const created = await createLiveMoveRequest(storedDraft);

          if (cancelled) {
            return;
          }

          moveRequestId = created.moveRequest.id;
          setDraft(created.nextDraft);
        }
      }

      setState("loading");
      const liveData = await fetchLiveOffersForMoveRequest(moveRequestId);

      if (cancelled) {
        return;
      }

      setDraft(draftFromMoveRequest(liveData.moveRequest));
      setData(liveData);
      setState("ready");
      setMessage(null);
    }

    loadLiveResults().catch((error) => {
      if (cancelled) {
        return;
      }

      const nextMessage =
        error instanceof Error ? error.message : "Unable to load live offers for this move.";

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

  const loginHref = getCustomerMoveRequestLoginHref({
    pathname: "/move/new/results",
    moveRequestId: initialMoveRequestId,
  });
  const incompleteStepHref = getStepHref(getMoveRequestDraftFirstIncompleteStep(readMoveRequestDraft()));

  if (state === "loading" || state === "creating") {
    return (
      <main className="pb-28">
        <TopAppBar title="Live matches" backHref="/move/new" rightHref="/" rightLabel="Close" />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">{state === "creating" ? "Creating request" : "Loading matches"}</p>
            <h1 className="mt-1 text-lg text-text">
              {state === "creating"
                ? "Saving your move so we can fetch real offers"
                : "Pulling live spare-capacity trips for this corridor"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              MoveMate is checking current listings and ranking them by route fit, timing, and trust.
            </p>
          </Card>
        </section>
      </main>
    );
  }

  if (state === "auth_required") {
    return (
      <main className="pb-28">
        <TopAppBar title="Live matches" backHref="/move/new" rightHref="/" rightLabel="Close" />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">Log in first</p>
            <h1 className="mt-1 text-lg text-text">See real matches after sign-in</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ??
                "Your route and item draft stay on this device, so you can sign in and come straight back to live results."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={loginHref}>Log in to continue</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/move/new/route">Edit this move</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  if (state === "incomplete" || state === "error" || !data) {
    return (
      <main className="pb-28">
        <TopAppBar title="Live matches" backHref="/move/new" rightHref="/" rightLabel="Close" />
        <section className="screen space-y-4">
          <Card className="p-4">
            <p className="section-label">{state === "incomplete" ? "Finish the draft" : "Could not load matches"}</p>
            <h1 className="mt-1 text-lg text-text">
              {state === "incomplete"
                ? "We need a little more detail before we can rank real offers"
                : "Something blocked the live offer load"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ??
                "Go back one step and try again. The move draft stays intact while you adjust it."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={incompleteStepHref}>Edit the move</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={getMoveRequestResultsHref(initialMoveRequestId)}>Try again</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const { moveRequest, offers, source } = data;
  const { topMatches, needsReview, nearbyDate } = splitOfferGroups(offers);
  const fastMatchHref = getMoveRequestFastMatchHref(moveRequest.id);
  const itemSummary = [
    ITEM_CATEGORY_LABELS[moveRequest.item.category],
    moveRequest.item.sizeClass ? `${moveRequest.item.sizeClass} size` : null,
    moveRequest.item.weightBand ? moveRequest.item.weightBand.replaceAll("_", " ") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="pb-28">
      <TopAppBar title="Live matches" backHref="/move/new" rightHref="/" rightLabel="Close" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">
            {moveRequest.route.pickupSuburb} → {moveRequest.route.dropoffSuburb}
          </p>
          <h1 className="heading">
            {offers.length === 0
              ? "No live route fits yet"
              : `${offers.length} live ${offers.length === 1 ? "offer" : "offers"} ranked for this move`}
          </h1>
          <p className="body text-[var(--text-secondary)]">
            {moveRequest.item.description} · {itemSummary}
            {moveRequest.route.preferredDate
              ? ` · ${formatDate(moveRequest.route.preferredDate)}`
              : " · Date flexible"}
            {moveRequest.route.preferredTimeWindow
              ? ` · ${TIME_WINDOW_LABELS[moveRequest.route.preferredTimeWindow]}`
              : ""}
          </p>
        </div>

        <Card className="p-4">
          <p className="section-label">Move summary</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 text-sm text-text-secondary">
              <p className="font-medium text-text">Route</p>
              <p>
                {moveRequest.route.pickupSuburb} to {moveRequest.route.dropoffSuburb}
              </p>
              <p>
                {moveRequest.route.preferredDate
                  ? formatDate(moveRequest.route.preferredDate)
                  : "Any nearby date"}{" "}
                · {TIME_WINDOW_LABELS[moveRequest.route.preferredTimeWindow ?? "flexible"]}
              </p>
            </div>
            <div className="space-y-2 text-sm text-text-secondary">
              <p className="font-medium text-text">Handling</p>
              <p>{moveRequest.item.description}</p>
              <p>
                {moveRequest.needsStairs ? "Stairs flagged" : "No stairs"} ·{" "}
                {moveRequest.needsHelper ? "Helper requested" : "No helper"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/move/new#route">Edit route</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/move/new#item">Edit item</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/move/new#timing">Edit timing</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/move/new#access">Edit access</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <p className="section-label">How these were ranked</p>
          <p className="mt-2 text-sm text-text-secondary">
            MoveMate starts from your need, then ranks live spare-capacity trips by route fit,
            timing, access compatibility, and carrier trust. This is not a browse-first list of
            drivers.
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {source === "persisted"
              ? "These offers were already attached to your move request."
              : "These offers were derived from currently active live listings for this route."}
          </p>
        </Card>

        {offers.length > 1 ? (
          <Card className="border-accent/15 bg-accent/5 p-4">
            <p className="section-label">Need a faster yes?</p>
            <h2 className="mt-1 text-lg text-text">Fast Match can ask the next-best carriers at once</h2>
            <p className="mt-2 text-sm text-text-secondary">
              The price stays all-in and fixed. Fast Match is explicit, not bidding, and closes the
              rest as soon as one carrier accepts.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href={fastMatchHref}>Review Fast Match</Link>
              </Button>
            </div>
          </Card>
        ) : null}

        {offers.length === 0 ? (
          <Card className="p-4">
            <p className="section-label">No offers yet</p>
            <h2 className="mt-1 text-lg text-text">Try widening the timing or route assumptions</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Live corridor fits can open up quickly when the date is flexible or the access notes
              are clearer.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/move/new#timing">Edit timing</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/move/new#route">Edit route</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <OfferSection
              title="Top matches"
              description="Best current route fits with the clearest price and trust story."
              offers={topMatches}
              moveRequestId={moveRequest.id}
              preferredDate={moveRequest.route.preferredDate ?? undefined}
            />
            <OfferSection
              title="Needs review"
              description="These might still work, but the carrier will likely need a closer fit check."
              offers={needsReview}
              moveRequestId={moveRequest.id}
              preferredDate={moveRequest.route.preferredDate ?? undefined}
            />
            <OfferSection
              title="Nearby dates"
              description="Live routes that fit the corridor but run on a nearby day."
              offers={nearbyDate}
              moveRequestId={moveRequest.id}
              preferredDate={moveRequest.route.preferredDate ?? undefined}
            />
          </>
        )}
      </section>
    </main>
  );
}
