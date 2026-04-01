import { Suspense } from "react";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { SaveSearchForm } from "@/components/search/save-search-form";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { Button } from "@/components/ui/button";
import { getOptionalSessionUser } from "@/lib/auth";
import { TripCard } from "@/components/trip/trip-card";
import { searchTrips } from "@/lib/data/trips";
import type { ItemCategory } from "@/types/trip";
import { getTodayIsoDate } from "@/lib/utils";

function getValue(
  value: string | string[] | undefined,
  fallback: string,
) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

async function SearchResultsSection({
  from,
  to,
  when,
  what,
  backload,
  userEmail,
  redirectSearch,
}: {
  from: string;
  to: string;
  when: string;
  what: ItemCategory;
  backload: boolean;
  userEmail?: string;
  redirectSearch: string;
}) {
  const searchResponse = await searchTrips({
    from,
    to,
    when,
    what,
    isReturnTrip: backload,
  });
  const results = searchResponse.results;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-secondary">
        {results.length} trips for {from} to {to} on {when}.
      </p>
      {!searchResponse.geocodingAvailable ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text">
          We hit a location lookup issue for this search, so these results use suburb matching
          instead of route distance.
        </div>
      ) : null}
      {searchResponse.fallbackUsed ? (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
          <p className="text-sm font-medium text-text">
            No trips on your exact date. Showing nearby dates instead.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {searchResponse.nearbyDateOptions.map((date) => (
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
                {date}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-4">
        {results.map((trip) => (
          <TripCard key={trip.id} trip={trip} href={`/trip/${trip.id}`} />
        ))}
      </div>
      <div className="surface-card p-4">
        <div className="space-y-3">
          <div>
            <p className="section-label">Save this search</p>
            <h2 className="mt-1 text-lg text-text">
              {results.length === 0
                ? "No trips available yet for this route"
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
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const from = getValue(searchParams.from, "Penrith");
  const to = getValue(searchParams.to, "Bondi");
  const when = getValue(searchParams.when, getTodayIsoDate());
  const what = getValue(searchParams.what, "furniture") as ItemCategory;
  const backload = getValue(searchParams.backload, "0") === "1";
  const user = await getOptionalSessionUser();
  const redirectSearch = new URLSearchParams({
    from,
    to,
    when,
    what,
    ...(backload ? { backload: "1" } : {}),
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
          when,
          what,
          backload,
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
            userEmail={user?.email ?? undefined}
            redirectSearch={redirectSearch}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
