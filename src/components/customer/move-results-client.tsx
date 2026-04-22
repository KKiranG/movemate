"use client";

import Link from "next/link";
import { Bell, Route, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { TripCard } from "@/components/trip/trip-card";
import {
  draftFromMoveRequest,
  getMoveRequestDraftFirstIncompleteStep,
  getMoveRequestOfferHref,
  getMoveRequestResultsHref,
  isPersistedMoveRequestReusable,
  readMoveRequestDraft,
} from "@/components/customer/move-request-draft";
import { useMoveRequestDraft } from "@/components/customer/use-move-request-draft";
import {
  createFastMatchRequest,
  createLiveMoveRequest,
  fetchLiveOffersForMoveRequest,
  getCustomerMoveRequestLoginHref,
  type LiveMoveOffer,
  type LiveMoveOfferResponse,
} from "@/components/customer/move-live-data";
import { TopAppBar } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ITEM_CATEGORY_LABELS } from "@/lib/constants";
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

  return { topMatches, needsReview, nearbyDate };
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
  selectedIds,
  onSelect,
}: {
  title: string;
  description: string;
  offers: LiveMoveOffer[];
  moveRequestId: string;
  selectedIds: Set<string>;
  onSelect: (tripId: string) => void;
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
          <TripCard
            key={offer.id}
            trip={trip}
            href={getMoveRequestOfferHref({ offerId: offer.id, moveRequestId })}
            selected={selectedIds.has(trip.id)}
            onSelect={selectedIds.size > 0 || onSelect ? onSelect : undefined}
          />
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFastMatching, setIsFastMatching] = useState(false);
  const [fastMatchMessage, setFastMatchMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    async function loadLiveResults() {
      if (!isAuthenticated) {
        setState("auth_required");
        setMessage("Log in to see real spare-capacity matches for this move.");
        return;
      }

      const storedDraft = readMoveRequestDraft();
      let moveRequestId = initialMoveRequestId ?? null;

      if (!moveRequestId) {
        const missingStep = getMoveRequestDraftFirstIncompleteStep(storedDraft);

        if (missingStep) {
          setState("incomplete");
          setMessage("Add both addresses so we can match the corridor.");
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

  function toggleSelect(tripId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else if (next.size < 3) {
        next.add(tripId);
      }
      return next;
    });
  }

  async function handleFastMatch() {
    if (!data || isFastMatching || selectedIds.size === 0) return;
    setIsFastMatching(true);
    setFastMatchMessage(null);
    try {
      await createFastMatchRequest(data.moveRequest.id);
      window.location.href = "/bookings";
    } catch (error) {
      setFastMatchMessage(error instanceof Error ? error.message : "Fast Match failed. Try again.");
      setIsFastMatching(false);
    }
  }

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
            <p className="section-label">{state === "creating" ? "One moment" : "Loading"}</p>
            <h1 className="mt-1 text-lg text-text">Finding drivers going your way</h1>
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
            <p className="section-label">Sign in first</p>
            <h1 className="mt-1 text-lg text-text">See your matches after sign-in</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ?? "Your move stays saved while you sign in."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={loginHref}>Log in</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/move/new">Edit move</Link>
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
            <p className="section-label">{state === "incomplete" ? "Almost there" : "Something went wrong"}</p>
            <h1 className="mt-1 text-lg text-text">
              {state === "incomplete" ? "Finish the route details first" : "Could not load matches"}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {message ?? "Go back and try again."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={incompleteStepHref}>Edit move</Link>
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

  const { moveRequest, offers } = data;
  const { topMatches, needsReview, nearbyDate } = splitOfferGroups(offers);
  const itemLabel = ITEM_CATEGORY_LABELS[moveRequest.item.category];

  return (
    <main className="pb-28">
      <TopAppBar title="Live matches" backHref="/move/new" rightHref="/" rightLabel="Close" />
      <section className="screen space-y-5">
        <div className="space-y-1">
          <p className="eyebrow">
            {moveRequest.route.pickupSuburb} → {moveRequest.route.dropoffSuburb}
          </p>
          <h1 className="heading">
            {offers.length === 0
              ? "No drivers going that way — yet."
              : `${offers.length} ${offers.length === 1 ? "match" : "matches"}`}
          </h1>
          <p className="body text-[var(--text-secondary)]">
            {itemLabel}
            {moveRequest.route.preferredDate
              ? ` · ${formatDate(moveRequest.route.preferredDate)}`
              : " · Flexible dates"}
          </p>
        </div>

        {/* Move summary — compact edit row */}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/move/new#route">Edit route</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/move/new#timing">Edit timing</Link>
          </Button>
        </div>

        {offers.length === 0 ? (
          <>
            <div className="space-y-5">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated-2)]">
                  <Route className="h-5 w-5 text-[var(--text-primary)]" strokeWidth={1.7} />
                </div>
                <p className="mt-3 text-[15px] leading-[1.5] text-[var(--text-secondary)]">
                  {moveRequest.route.pickupSuburb} → {moveRequest.route.dropoffSuburb} is quiet
                  right now. We&apos;ll alert drivers on similar corridors and notify you the moment
                  one posts.
                </p>
              </div>

              <Card className="p-4">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">What happens</p>
                <div className="space-y-4">
                  {[
                    ["We alert drivers now", "Usually a match within 24 hrs on popular weekends"],
                    ["You get notified", "Push and email the moment someone posts your route"],
                    ["If still nothing in 48 hrs", "Our team finds a driver manually — same price, no premium"],
                  ].map(([title, note], i) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--text-primary)]">
                        <span className="text-[11px] font-bold tabular-nums">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
                        <p className="mt-0.5 text-[13px] leading-[1.45] text-[var(--text-secondary)]">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/move/new#timing">Adjust timing</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/move/new#route">Adjust route</Link>
                </Button>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3">
              <Button asChild className="w-full">
                <Link href={`/move/alert?moveRequestId=${moveRequest.id}`}>
                  <Bell className="mr-2 h-4 w-4" />
                  Alert the network
                </Link>
              </Button>
              <p className="mt-2 text-center text-[12px] text-[var(--text-tertiary)]">
                Nothing is charged until a driver accepts.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Fast Match tip — only shown when 2+ offers and none yet selected */}
            {offers.length > 1 && selectedIds.size === 0 ? (
              <p className="text-sm text-text-secondary">
                Tap a card to select it, or tap <strong className="text-text">View offer</strong> to
                review details. Select up to 3 to Fast Match them simultaneously.
              </p>
            ) : null}

            <OfferSection
              title="Top matches"
              description="Best current route fits."
              offers={topMatches}
              moveRequestId={moveRequest.id}
              selectedIds={selectedIds}
              onSelect={toggleSelect}
            />
            <OfferSection
              title="Needs review"
              description="Could work — carrier will want a closer look."
              offers={needsReview}
              moveRequestId={moveRequest.id}
              selectedIds={selectedIds}
              onSelect={toggleSelect}
            />
            <OfferSection
              title="Nearby dates"
              description="Same corridor, slightly different day."
              offers={nearbyDate}
              moveRequestId={moveRequest.id}
              selectedIds={selectedIds}
              onSelect={toggleSelect}
            />
          </>
        )}
      </section>

      {/* Fast Match sticky bottom bar — appears when 1+ cards selected */}
      {selectedIds.size > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3">
          {fastMatchMessage ? (
            <p className="mb-2 text-sm text-error">{fastMatchMessage}</p>
          ) : null}
          <Button
            type="button"
            onClick={handleFastMatch}
            disabled={isFastMatching}
            className="w-full"
          >
            <Zap className="mr-2 h-4 w-4" />
            {isFastMatching
              ? "Sending requests…"
              : `Fast Match ${selectedIds.size} ${selectedIds.size === 1 ? "offer" : "offers"} — first accept wins`}
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="mt-2 w-full text-center text-sm text-text-secondary active:opacity-70"
          >
            Cancel selection
          </button>
        </div>
      ) : null}
    </main>
  );
}
