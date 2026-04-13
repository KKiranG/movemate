import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { SaveAlertForm } from "@/components/search/save-alert-form";
import { PageIntro } from "@/components/layout/page-intro";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { SearchBar } from "@/components/search/search-bar";
import { SearchRefineButton } from "@/components/search/search-refine-button";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOptionalSessionUser } from "@/lib/auth";
import { TripCard } from "@/components/trip/trip-card";
import { getCustomerProfileForUser } from "@/lib/data/profiles";
import { getMoveRequestByIdForCustomer } from "@/lib/data/move-requests";
import { deriveOffersForMoveRequest, listOffersForMoveRequest } from "@/lib/data/offers";
import { searchTrips } from "@/lib/data/trips";
import { getTripById } from "@/lib/data/trips";
import { getCorridorActivitySummary, type CorridorActivitySummary } from "@/lib/data/unmatched-requests";
import { getTripNearbyDateExplanation, getTripQualityScore } from "@/lib/trip-presenters";
import { formatDate, formatLongDate, getDateOffsetIso, getTodayIsoDate } from "@/lib/utils";
import type { MoveRequest, Offer } from "@/types/move-request";
import type { ItemCategory, Trip, TripSearchResult } from "@/types/trip";

function buildSearchCanonical({
  from,
  to,
  what,
  backload,
}: {
  from: string;
  to: string;
  what: ItemCategory;
  backload: boolean;
}) {
  const params = new URLSearchParams();

  if (from.trim()) {
    params.set("from", from.trim());
  }

  if (to.trim()) {
    params.set("to", to.trim());
  }

  if (what && what !== "furniture") {
    params.set("what", what);
  }

  if (backload) {
    params.set("backload", "1");
  }

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function groupTripsByDate(results: TripSearchResult[]) {
  return Array.from(
    results.reduce((map, trip) => {
      const current = map.get(trip.tripDate) ?? [];
      current.push(trip);
      map.set(trip.tripDate, current);
      return map;
    }, new Map<string, TripSearchResult[]>()),
  );
}

function buildTripDetailHref(params: {
  tripId: string;
  from: string;
  to: string;
  when?: string;
  what: ItemCategory;
  backload: boolean;
  page?: number;
  flexibleDates?: boolean;
  moveRequestId?: string;
  offerId?: string;
}) {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    ...(params.when ? { when: params.when } : {}),
    ...(params.what ? { what: params.what } : {}),
    ...(params.backload ? { backload: "1" } : {}),
    ...(params.page && params.page > 1 ? { page: String(params.page) } : {}),
    ...(params.flexibleDates ? { flex: "1" } : {}),
    ...(params.moveRequestId ? { moveRequestId: params.moveRequestId } : {}),
    ...(params.offerId ? { offerId: params.offerId } : {}),
  }).toString();

  return `/trip/${params.tripId}${query ? `?${query}` : ""}`;
}

function rankResultsByBestFit(results: TripSearchResult[]) {
  return [...results].sort((a, b) => {
    return (
      getTripQualityScore(b) - getTripQualityScore(a) ||
      a.tripDate.localeCompare(b.tripDate) ||
      b.matchScore - a.matchScore ||
      a.id.localeCompare(b.id)
    );
  });
}

interface RecoveredMoveRequestResult {
  moveRequest: MoveRequest;
  offers: Array<{
    offer: Offer;
    trip: Trip;
  }>;
  source: "persisted" | "derived";
}

async function getRecoveredMoveRequestResult(
  moveRequestId: string,
  userId?: string,
): Promise<RecoveredMoveRequestResult | null> {
  if (!userId) {
    return null;
  }

  const customer = await getCustomerProfileForUser(userId);

  if (!customer) {
    return null;
  }

  const moveRequest = await getMoveRequestByIdForCustomer(customer.id, moveRequestId);

  if (!moveRequest) {
    return null;
  }

  const persistedOffers = await listOffersForMoveRequest(moveRequest.id);
  const viableOffers = (
    persistedOffers.length > 0 ? persistedOffers : await deriveOffersForMoveRequest(moveRequest)
  ).filter((offer) => offer.status === "active" || offer.status === "selected");
  const trips = await Promise.all(viableOffers.map((offer) => getTripById(offer.listingId)));
  const offers = viableOffers
    .map((offer, index) => {
      const trip = trips[index];

      if (!trip) {
        return null;
      }

      return { offer, trip };
    })
    .filter(
      (
        entry,
      ): entry is {
        offer: Offer;
        trip: Trip;
      } => Boolean(entry),
    );

  return {
    moveRequest,
    offers,
    source: persistedOffers.length > 0 ? "persisted" : "derived",
  };
}

function CorridorActivityCard({
  summary,
}: {
  summary: CorridorActivitySummary;
}) {
  const lines: string[] = [];

  if (summary.upcomingTripCount > 0) {
    lines.push(
      `${summary.upcomingTripCount} spare-capacity trip${summary.upcomingTripCount === 1 ? " is" : "s are"} already posted on this corridor.`,
    );
  }

  if (summary.recentTripPostCount > 0) {
    lines.push(
      `${summary.recentTripPostCount} trip post${summary.recentTripPostCount === 1 ? " was" : "s were"} created for this corridor in the last 14 days.`,
    );
  }

  if (summary.recentDemandCount && summary.recentDemandCount > 0) {
    lines.push(
      `${summary.recentDemandCount} customer move need${summary.recentDemandCount === 1 ? " was" : "s were"} logged on this corridor in the last 30 days.`,
    );
  }

  if (summary.openAlertCount && summary.openAlertCount > 0) {
    lines.push(
      `${summary.openAlertCount} active route alert${summary.openAlertCount === 1 ? "" : "s"} are still waiting for a fit here.`,
    );
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <p className="section-label">Corridor activity</p>
          <h2 className="mt-1 text-lg text-text">Real activity signals for this route</h2>
        </div>
        <div className="grid gap-2 text-sm text-text-secondary">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </Card>
  );
}

async function SearchResultsSection({
  from,
  to,
  when,
  what,
  backload,
  page,
  flexibleDates,
  userEmail,
  redirectSearch,
  moveRequestId,
  recoveredMoveRequest,
}: {
  from: string;
  to: string;
  when?: string;
  what: ItemCategory;
  backload: boolean;
  page: number;
  flexibleDates: boolean;
  userEmail?: string;
  redirectSearch: string;
  moveRequestId?: string;
  recoveredMoveRequest?: RecoveredMoveRequestResult | null;
}) {
  const hasSearchIntent = Boolean(from.trim() || to.trim() || when || moveRequestId);

  if (moveRequestId && !recoveredMoveRequest && !userEmail) {
    return (
      <div className="grid gap-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">Reopen your move request</p>
              <h2 className="mt-1 text-lg text-text">Sign in to continue the same request</h2>
            </div>
            <p className="subtle-text">
              This matched alert points to a saved move request. Sign in first so moverrr can load
              the same move details and any recovered offers tied to it.
            </p>
            <Button asChild className="min-h-[44px] active:opacity-80">
              <Link href={`/login?next=/search?${redirectSearch}`}>Sign in to reopen request</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!hasSearchIntent) {
    return (
      <div className="grid gap-4">
        <Card className="p-4">
          <div className="space-y-3">
              <div>
                <p className="section-label">Start here</p>
                <h2 className="mt-1 text-lg text-text">Start with the move details</h2>
              </div>
              <p className="subtle-text">
                Enter the pickup suburb, dropoff suburb, timing, and move type.
                moverrr will rank the strongest spare-capacity matches for that need.
              </p>
            </div>
          </Card>
        <Card className="p-4">
          <p className="section-label">Tip</p>
          <p className="mt-1 text-sm text-text-secondary">
            If you already searched once, the browser draft will refill your route and timing when
            you come back on this device.
          </p>
        </Card>
      </div>
    );
  }

  const flexibleDatesWindow =
    flexibleDates && when
      ? [-3, -2, -1, 0, 1, 2, 3]
          .map((offset) => getDateOffsetIso(when, offset))
          .filter((date) => date >= getTodayIsoDate())
      : undefined;

  const searchResponse = await searchTrips({
    from,
    to,
    when,
    dates: flexibleDatesWindow,
    what,
    isReturnTrip: backload,
    flexibleDates,
    page,
  });
  const sortedResults = rankResultsByBestFit(searchResponse.results);
  const corridorActivity =
    sortedResults.length === 0 && from && to
      ? await getCorridorActivitySummary({
          pickupSuburb: from,
          dropoffSuburb: to,
        })
      : null;
  const groupedResults = flexibleDates ? groupTripsByDate(sortedResults) : [];
  const nearbyDates =
    searchResponse.nearbyDateOptions.length > 0
      ? searchResponse.nearbyDateOptions
      : when
        ? [-3, -2, -1, 1, 2, 3]
            .map((offset) => getDateOffsetIso(when, offset))
            .filter((date) => date >= getTodayIsoDate())
        : [];
  const resultSummary = `${searchResponse.visibleCount} of ${searchResponse.totalCount} best-fit matches for ${from} to ${to}${
    when ? ` ${flexibleDates ? `around ${formatLongDate(when)}` : `on ${formatLongDate(when)}`}` : ""
  }.`;
  const showMoreHref = `/search?${new URLSearchParams({
    from,
    to,
    ...(when ? { when } : {}),
    what,
    ...(backload ? { backload: "1" } : {}),
    ...(flexibleDates ? { flex: "1" } : {}),
    page: String(page + 1),
  }).toString()}`;

  if (recoveredMoveRequest && recoveredMoveRequest.offers.length > 0) {
    return (
      <div id="search-results" className="flex flex-col gap-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">Recovered move request</p>
              <h2 className="mt-1 text-lg text-text">New viable matches for the same move need</h2>
            </div>
            <p className="subtle-text">
              moverrr reopened your original request for{" "}
              {recoveredMoveRequest.moveRequest.route.pickupSuburb} to{" "}
              {recoveredMoveRequest.moveRequest.route.dropoffSuburb}. These offers are tied to the
              same move details so you can continue instead of rebuilding the request.
            </p>
            <div className="grid gap-2 text-sm text-text-secondary">
              <p>Item: {recoveredMoveRequest.moveRequest.item.description}</p>
              {recoveredMoveRequest.moveRequest.route.preferredDate ? (
                <p>
                  Preferred date: {formatLongDate(recoveredMoveRequest.moveRequest.route.preferredDate)}
                </p>
              ) : null}
              <p>
                Offer source:{" "}
                {recoveredMoveRequest.source === "persisted"
                  ? "previously stored recovered offers"
                  : "freshly ranked route matches for the saved move request"}
              </p>
            </div>
          </div>
        </Card>
        <div className="grid gap-4">
          {recoveredMoveRequest.offers.map(({ offer, trip }) => (
            <TripCard
              key={offer.id}
              trip={trip}
              preferredDate={recoveredMoveRequest.moveRequest.route.preferredDate ?? undefined}
              href={buildTripDetailHref({
                tripId: trip.id,
                from: recoveredMoveRequest.moveRequest.route.pickupSuburb,
                to: recoveredMoveRequest.moveRequest.route.dropoffSuburb,
                when: recoveredMoveRequest.moveRequest.route.preferredDate ?? undefined,
                what: recoveredMoveRequest.moveRequest.item.category,
                backload,
                moveRequestId: recoveredMoveRequest.moveRequest.id,
                offerId: offer.id,
              })}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="search-results" className="flex flex-col gap-2">
      <p className="text-sm text-text-secondary">{resultSummary}</p>
      {!searchResponse.geocodingAvailable ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text">
          Showing results from moverrr&apos;s suburb coordinate fallback. These matches use known
          Sydney suburb positions instead of plain suburb-name text matching.
        </div>
      ) : null}
      {searchResponse.fallbackReason === "geocoding_failed" ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text">
          moverrr could not resolve one of those suburbs cleanly through Google Maps. Check the
          suburb spelling or choose a more specific suburb before trying again.
        </div>
      ) : null}
      {searchResponse.fallbackUsed || sortedResults.length === 0 ? (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
          <p className="text-sm font-medium text-text">
            {sortedResults.length === 0
              ? "No direct matches found for that exact route."
              : "No direct matches on your exact date. Showing nearby dates instead."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nearbyDates.map((date) => (
              <Link
                key={date}
                href={`/search?${new URLSearchParams({
                  from,
                  to,
                  when: date,
                  what,
                  ...(backload ? { backload: "1" } : {}),
                }).toString()}`}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-3 py-2 text-sm font-medium text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
              >
                {formatDate(date)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {sortedResults.length > 0 ? (
        <div className="grid gap-4">
          {flexibleDates
            ? groupedResults.map(([date, trips]) => (
                <div key={date} className="grid gap-3">
                  <div>
                    <p className="section-label">Date group</p>
                    <h2 className="mt-1 text-lg text-text">{formatLongDate(date)}</h2>
                  </div>
                  <div className="grid gap-4">
                    {trips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        preferredDate={when}
                        href={buildTripDetailHref({
                          tripId: trip.id,
                          from,
                          to,
                          when,
                          what,
                          backload,
                          page,
                          flexibleDates,
                        })}
                      />
                    ))}
                  </div>
                </div>
              ))
            : sortedResults.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  preferredDate={when}
                  href={buildTripDetailHref({
                    tripId: trip.id,
                    from,
                    to,
                    when,
                    what,
                    backload,
                    page,
                  })}
                />
              ))}
          {searchResponse.hasMore ? (
            <Card className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-label">More matches</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Showing {searchResponse.visibleCount} of {searchResponse.totalCount} ranked
                    matches so far{flexibleDates ? " across nearby dates." : "."}
                  </p>
                </div>
                <Button asChild className="min-h-[44px] active:opacity-80">
                  <Link href={showMoreHref}>Show more matches</Link>
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <p className="section-label">No direct match yet</p>
                <h2 className="mt-1 text-lg text-text">Try nearby dates or keep this route on watch</h2>
              </div>
              <p className="subtle-text">
                Start with nearby dates first. If there is still no fit, keep this route on watch
                so moverrr can notify you when matching spare capacity appears.
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <p className="section-label">Nearby alternatives</p>
            <div className="mt-3 grid gap-3">
              {when ? (
                <Link
                  href={`/search?${new URLSearchParams({
                    from,
                    to,
                    what,
                    flex: "1",
                    ...(backload ? { backload: "1" } : {}),
                  }).toString()}`}
                  className="inline-flex min-h-[44px] items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                >
                  <span>See the same corridor across nearby dates</span>
                </Link>
              ) : null}
              {nearbyDates.slice(0, 3).map((date) => (
                <Link
                  key={date}
                  href={`/search?${new URLSearchParams({
                    from,
                    to,
                    when: date,
                    what,
                    ...(backload ? { backload: "1" } : {}),
                  }).toString()}`}
                  className="inline-flex min-h-[44px] items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                >
                  <span>
                    Try {formatLongDate(date)} instead
                    {(() => {
                      const explanation = getTripNearbyDateExplanation({
                        preferredDate: when,
                        tripDate: date,
                      });

                      return explanation ? ` · ${explanation}` : "";
                    })()}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
          {corridorActivity ? <CorridorActivityCard summary={corridorActivity} /> : null}
        </div>
      )}
      <div className="surface-card p-4">
        <div className="space-y-3">
          <div>
            <p className="section-label">Route alerts</p>
            <h2 className="mt-1 text-lg text-text">
              {sortedResults.length === 0
                ? "Get an alert when a matching trip appears"
                : "Keep this route on watch"}
            </h2>
          </div>
          <p className="subtle-text">
            We&apos;ll email you when new spare-capacity supply matches this route and move type.
          </p>
          {userEmail ? (
            <SaveAlertForm
              fromSuburb={from}
              toSuburb={to}
              itemCategory={what}
              dateFrom={when}
              userEmail={userEmail}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">Sign in to turn this route into an alert.</p>
              <Button asChild className="min-h-[44px] active:opacity-80">
                <Link href={`/login?next=/search?${redirectSearch}`}>
                  Sign in to get alerts
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const from = getValue(params.from);
  const to = getValue(params.to);
  const when = getValue(params.when) || undefined;
  const intent = getValue(params.intent) || "single_furniture";
  const backload = getValue(params.backload) === "1";
  const flexibleDates = getValue(params.flex) === "1";
  const page = Math.max(1, Number(getValue(params.page) || "1") || 1);
  const moveRequestId = getValue(params.moveRequestId) || undefined;
  const user = await getOptionalSessionUser();
  const recoveredMoveRequest = moveRequestId
    ? await getRecoveredMoveRequestResult(moveRequestId, user?.id)
    : null;
  const resolvedFrom = from || recoveredMoveRequest?.moveRequest.route.pickupSuburb || "";
  const resolvedTo = to || recoveredMoveRequest?.moveRequest.route.dropoffSuburb || "";
  const resolvedWhen = when || recoveredMoveRequest?.moveRequest.route.preferredDate || undefined;
  const resolvedWhat = (getValue(params.what) ||
    recoveredMoveRequest?.moveRequest.item.category ||
    "furniture") as ItemCategory;
  const redirectSearch = new URLSearchParams({
    ...(resolvedFrom ? { from: resolvedFrom } : {}),
    ...(resolvedTo ? { to: resolvedTo } : {}),
    ...(resolvedWhen ? { when: resolvedWhen } : {}),
    what: resolvedWhat,
    ...(intent ? { intent } : {}),
    ...(backload ? { backload: "1" } : {}),
    ...(flexibleDates ? { flex: "1" } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
    ...(moveRequestId ? { moveRequestId } : {}),
  }).toString();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Need-first matching"
        title="Tell us the move and we’ll rank the best matches"
        description="moverrr ranks spare-capacity options in best-fit order with route context, pricing clarity, and trust signals before you request a spot."
      />

      <SearchBar
        defaults={{
          from: resolvedFrom,
          to: resolvedTo,
          when: resolvedWhen ?? getTodayIsoDate(),
          what: resolvedWhat,
          intent: intent as
            | "single_furniture"
            | "appliance"
            | "marketplace_pickup"
            | "student_move"
            | "office_overflow"
            | "boxes",
          backload,
          flexibleDates,
        }}
      />

      <ErrorBoundary fallback={<SearchResultsSkeleton />}>
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResultsSection
            from={resolvedFrom}
            to={resolvedTo}
            when={resolvedWhen}
            what={resolvedWhat}
            backload={backload}
            page={page}
            flexibleDates={flexibleDates}
            userEmail={user?.email ?? undefined}
            redirectSearch={redirectSearch}
            moveRequestId={moveRequestId}
            recoveredMoveRequest={recoveredMoveRequest}
          />
        </Suspense>
      </ErrorBoundary>

      {resolvedFrom || resolvedTo || resolvedWhen || moveRequestId ? <SearchRefineButton /> : null}
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const from = getValue(params.from);
  const to = getValue(params.to);
  const what = (getValue(params.what) || "furniture") as ItemCategory;
  const backload = getValue(params.backload) === "1";
  const canonical = buildSearchCanonical({ from, to, what, backload });

  if (!from && !to) {
    return {
      title: "Find a move match",
      description: "Tell moverrr the route, timing, and move type to see ranked spare-capacity matches across Sydney.",
      alternates: { canonical },
    };
  }

  const routeLabel = [from, to].filter(Boolean).join(" to ");
  const categoryLabel = what === "furniture" ? "moves" : `${what} moves`;

  return {
    title: `${routeLabel} ${categoryLabel}`,
    description: `See ranked spare-capacity matches for ${routeLabel} on moverrr with clear fit notes, timing, and customer pricing.`,
    alternates: { canonical },
  };
}
