import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { SaveSearchForm } from "@/components/search/save-search-form";
import { SearchBar } from "@/components/search/search-bar";
import { SearchRefineButton } from "@/components/search/search-refine-button";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOptionalSessionUser } from "@/lib/auth";
import { TripCard } from "@/components/trip/trip-card";
import { searchTrips } from "@/lib/data/trips";
import { getTripQualityScore } from "@/lib/trip-presenters";
import { formatDate, formatLongDate, getDateOffsetIso, getTodayIsoDate } from "@/lib/utils";
import type { ItemCategory, TripSearchResult } from "@/types/trip";

type SearchSort = "date" | "price" | "rating";

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

function buildTripDetailHref(params: {
  tripId: string;
  from: string;
  to: string;
  when?: string;
  what: ItemCategory;
  backload: boolean;
  sort: SearchSort;
  page?: number;
}) {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    ...(params.when ? { when: params.when } : {}),
    ...(params.what ? { what: params.what } : {}),
    ...(params.backload ? { backload: "1" } : {}),
    ...(params.sort !== "date" ? { sort: params.sort } : {}),
    ...(params.page && params.page > 1 ? { page: String(params.page) } : {}),
  }).toString();

  return `/trip/${params.tripId}${query ? `?${query}` : ""}`;
}

function sortResults(
  results: TripSearchResult[],
  sort: SearchSort,
) {
  return [...results].sort((a, b) => {
    if (sort === "price") {
      return (
        a.priceCents - b.priceCents ||
        b.matchScore - a.matchScore ||
        a.tripDate.localeCompare(b.tripDate) ||
        a.id.localeCompare(b.id)
      );
    }

    if (sort === "rating") {
      return (
        b.carrier.averageRating - a.carrier.averageRating ||
        b.carrier.ratingCount - a.carrier.ratingCount ||
        b.matchScore - a.matchScore ||
        a.tripDate.localeCompare(b.tripDate) ||
        a.id.localeCompare(b.id)
      );
    }

    return (
      getTripQualityScore(b) - getTripQualityScore(a) ||
      a.tripDate.localeCompare(b.tripDate) ||
      b.matchScore - a.matchScore ||
      a.id.localeCompare(b.id)
    );
  });
}

async function SearchResultsSection({
  from,
  to,
  when,
  what,
  backload,
  sort,
  page,
  userEmail,
  redirectSearch,
}: {
  from: string;
  to: string;
  when?: string;
  what: ItemCategory;
  backload: boolean;
  sort: SearchSort;
  page: number;
  userEmail?: string;
  redirectSearch: string;
}) {
  const hasSearchIntent = Boolean(from.trim() || to.trim() || when);

  if (!hasSearchIntent) {
    return (
      <div className="grid gap-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">Start here</p>
              <h2 className="mt-1 text-lg text-text">Search by suburb and date</h2>
            </div>
            <p className="subtle-text">
              moverrr starts with live listings. Enter a route above and we’ll restore your draft the
              next time you come back on this device.
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="section-label">Tip</p>
          <p className="mt-1 text-sm text-text-secondary">
            If you already searched once, the browser draft will refill your suburbs and date when
            you return.
          </p>
        </Card>
      </div>
    );
  }

  const searchResponse = await searchTrips({
    from,
    to,
    when,
    what,
    isReturnTrip: backload,
    page,
  });
  const sortedResults = sortResults(searchResponse.results, sort);
  const nearbyDates =
    searchResponse.nearbyDateOptions.length > 0
      ? searchResponse.nearbyDateOptions
      : when
        ? [-3, -2, -1, 1, 2, 3]
            .map((offset) => getDateOffsetIso(when, offset))
            .filter((date) => date >= getTodayIsoDate())
        : [];
  const resultSummary = `${searchResponse.visibleCount} of ${searchResponse.totalCount} trips for ${from} to ${to}${
    when ? ` on ${formatLongDate(when)}` : ""
  }.`;
  const showMoreHref = `/search?${new URLSearchParams({
    from,
    to,
    ...(when ? { when } : {}),
    what,
    ...(backload ? { backload: "1" } : {}),
    ...(sort !== "date" ? { sort } : {}),
    page: String(page + 1),
  }).toString()}`;

  return (
    <div id="search-results" className="flex flex-col gap-2">
      <p className="text-sm text-text-secondary">{resultSummary}</p>
      {!searchResponse.geocodingAvailable ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text">
          Showing results near these suburbs. They may include nearby areas when route-distance
          lookup is unavailable.
        </div>
      ) : null}
      {searchResponse.fallbackUsed || sortedResults.length === 0 ? (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
          <p className="text-sm font-medium text-text">
            {sortedResults.length === 0
              ? "No trips found for that exact route."
              : "No trips on your exact date. Showing nearby dates instead."}
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
                  sort,
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
          {sortedResults.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              href={buildTripDetailHref({
                tripId: trip.id,
                from,
                to,
                when,
                what,
                backload,
                sort,
                page,
              })}
            />
          ))}
          {searchResponse.hasMore ? (
            <Card className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-label">Keep browsing</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Showing {searchResponse.visibleCount} of {searchResponse.totalCount} matching
                    trips so far.
                  </p>
                </div>
                <Button asChild className="min-h-[44px] active:opacity-80">
                  <Link href={showMoreHref}>Show more trips</Link>
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
                <p className="section-label">No match yet</p>
                <h2 className="mt-1 text-lg text-text">Save the corridor and keep searching</h2>
              </div>
              <p className="subtle-text">
                You can widen the date window, browse the same corridor without a fixed day, or
                save this route so moverrr can alert you when supply appears.
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
                    sort,
                    ...(backload ? { backload: "1" } : {}),
                  }).toString()}`}
                  className="inline-flex min-h-[44px] items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                >
                  <span>See the same corridor without fixing the date first</span>
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
                    sort,
                    ...(backload ? { backload: "1" } : {}),
                  }).toString()}`}
                  className="inline-flex min-h-[44px] items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                >
                  <span>Try {formatLongDate(date)} instead</span>
                </Link>
              ))}
              <Link
                href={`/search?${new URLSearchParams({
                  from,
                  to,
                  when: when ?? "",
                  what: "furniture",
                  sort,
                  ...(backload ? { backload: "1" } : {}),
                }).toString()}`}
                className="inline-flex min-h-[44px] items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
              >
                <span>Broaden to general furniture inventory on this corridor</span>
              </Link>
            </div>
          </Card>
        </div>
      )}
      <div className="surface-card p-4">
        <div className="space-y-3">
          <div>
            <p className="section-label">Save this search</p>
            <h2 className="mt-1 text-lg text-text">
              {sortedResults.length === 0
                ? "Get an alert when this route shows up"
                : "Get notified when new trips appear"}
            </h2>
          </div>
          <p className="subtle-text">
            We&apos;ll email you when a new spare-capacity trip matches this route and item type.
          </p>
          {userEmail ? (
            <SaveSearchForm
              fromSuburb={from}
              toSuburb={to}
              itemCategory={what}
              dateFrom={when}
              userEmail={userEmail}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">Sign in to save this search.</p>
              <Button asChild className="min-h-[44px] active:opacity-80">
                <Link href={`/login?next=/search?${redirectSearch}`}>
                  Sign in to get notified
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
  const what = (getValue(params.what) || "furniture") as ItemCategory;
  const backload = getValue(params.backload) === "1";
  const sort = (getValue(params.sort) || "date") as SearchSort;
  const page = Math.max(1, Number(getValue(params.page) || "1") || 1);
  const user = await getOptionalSessionUser();
  const redirectSearch = new URLSearchParams({
    from,
    to,
    ...(when ? { when } : {}),
    what,
    ...(backload ? { backload: "1" } : {}),
    ...(sort !== "date" ? { sort } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  }).toString();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Browse & book"
        title="Search matching trips"
        description="Browse-first means customers see real spare-capacity inventory first, with route alerts only when supply is missing."
      />

      <SearchBar
        defaults={{
          from,
          to,
          when: when ?? getTodayIsoDate(),
          what,
          backload,
          sort,
        }}
      />

      <ErrorBoundary fallback={<SearchResultsSkeleton />}>
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResultsSection
            from={from}
            to={to}
            when={when}
            what={what}
            backload={backload}
            sort={sort}
            page={page}
            userEmail={user?.email ?? undefined}
            redirectSearch={redirectSearch}
          />
        </Suspense>
      </ErrorBoundary>

      {from || to || when ? <SearchRefineButton /> : null}
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
      title: "Search trips",
      description: "Browse live spare-capacity trips across Sydney by route, date, and item type.",
      alternates: { canonical },
    };
  }

  const routeLabel = [from, to].filter(Boolean).join(" to ");
  const categoryLabel = what === "furniture" ? "moves" : `${what} moves`;

  return {
    title: `${routeLabel} ${categoryLabel}`,
    description: `Browse live spare-capacity trips for ${routeLabel} on moverrr and compare transparent route-first pricing.`,
    alternates: { canonical },
  };
}
