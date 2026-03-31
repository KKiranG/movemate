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
  userEmail,
  redirectSearch,
}: {
  from: string;
  to: string;
  when: string;
  what: ItemCategory;
  userEmail?: string;
  redirectSearch: string;
}) {
  const results = await searchTrips({ from, to, when, what });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-secondary">
        {results.length} trips for {from} to {to} on {when}.
      </p>
      <div className="grid gap-4">
        {results.map((trip) => (
          <TripCard key={trip.id} trip={trip} href={`/trip/${trip.id}`} />
        ))}
      </div>
      {results.length === 0 ? (
        <div className="surface-card p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">Save this search</p>
              <h2 className="mt-1 text-lg text-text">No trips available yet for this route</h2>
            </div>
            <p className="subtle-text">
              We&apos;ll email you as soon as a carrier posts a matching trip.
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
      ) : null}
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
  const user = await getOptionalSessionUser();
  const redirectSearch = new URLSearchParams({
    from,
    to,
    when,
    what,
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

      <SearchBar />

      <ErrorBoundary fallback={<SearchResultsSkeleton />}>
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResultsSection
            from={from}
            to={to}
            when={when}
            what={what}
            userEmail={user?.email ?? undefined}
            redirectSearch={redirectSearch}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
