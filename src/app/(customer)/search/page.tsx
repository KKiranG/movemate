import { Suspense } from "react";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { SaveSearchForm } from "@/components/search/save-search-form";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOptionalSessionUser } from "@/lib/auth";
import { TripCard } from "@/components/trip/trip-card";
import { searchTrips } from "@/lib/data/trips";
import { getDateOffsetIso } from "@/lib/utils";
import type { ItemCategory } from "@/types/trip";

type SearchSort = "date" | "price" | "rating";

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function sortResults<T extends { tripDate: string; priceCents: number; carrier: { averageRating: number; ratingCount: number } }>(
  results: T[],
  sort: SearchSort,
) {
  return [...results].sort((a, b) => {
    if (sort === "price") {
      return a.priceCents - b.priceCents;
    }

    if (sort === "rating") {
      return b.carrier.averageRating - a.carrier.averageRating || b.carrier.ratingCount - a.carrier.ratingCount;
    }

    return a.tripDate.localeCompare(b.tripDate);
  });
}

async function SearchResultsSection({
  from,
  to,
  when,
  what,
  backload,
  sort,
  userEmail,
  redirectSearch,
}: {
  from: string;
  to: string;
  when?: string;
  what: ItemCategory;
  backload: boolean;
  sort: SearchSort;
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
  });
  const sortedResults = sortResults(searchResponse.results, sort);
  const nearbyDates =
    searchResponse.nearbyDateOptions.length > 0
      ? searchResponse.nearbyDateOptions
      : when
        ? [-3, -2, -1, 1, 2, 3].map((offset) => getDateOffsetIso(when, offset))
        : [];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-secondary">
        {sortedResults.length} trips for {from} to {to}
        {when ? ` on ${when}` : ""}.
      </p>
      {!searchResponse.geocodingAvailable ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text">
          We hit a location lookup issue for this search, so these results use suburb matching
          instead of route distance.
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
                {date}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {sortedResults.length > 0 ? (
        <div className="grid gap-4">
          {sortedResults.map((trip) => (
            <TripCard key={trip.id} trip={trip} href={`/trip/${trip.id}`} />
          ))}
        </div>
      ) : (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">No match yet</p>
              <h2 className="mt-1 text-lg text-text">Save the corridor and keep searching</h2>
            </div>
            <p className="subtle-text">
              You can widen the date window, tweak suburbs, or save this corridor so moverrr can
              alert you when supply appears.
            </p>
          </div>
        </Card>
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
  const user = await getOptionalSessionUser();
  const redirectSearch = new URLSearchParams({
    from,
    to,
    ...(when ? { when } : {}),
    what,
    ...(backload ? { backload: "1" } : {}),
    ...(sort !== "date" ? { sort } : {}),
  }).toString();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Browse & book"
        title="Search matching trips"
        description="Browse-first means customers see live listings first, with waitlist capture only when supply is missing."
        actions={
          <Link href="/" className="text-sm font-medium text-accent">
            Back to landing
          </Link>
        }
      />

      <SearchBar
        defaults={{
          from,
          to,
          when: when ?? "",
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
            userEmail={user?.email ?? undefined}
            redirectSearch={redirectSearch}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
