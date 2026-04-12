import type { Metadata } from "next";
import Link from "next/link";

import { ConfigBanner } from "@/components/shared/config-banner";
import { SearchBar } from "@/components/search/search-bar";
import { hasSupabaseEnv } from "@/lib/env";
import { getTodayIsoDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Need-first spare-capacity moves in Sydney",
  description:
    "Tell moverrr what needs moving and get ranked spare-capacity matches with clear pricing, fit notes, and trust signals.",
};

const useCases = [
  {
    title: "Marketplace pickup",
    description:
      "Bought a sofa in Penrith and need it in Bondi without paying for a full dedicated truck.",
  },
  {
    title: "Student move",
    description:
      "A desk, bookshelf, and a few boxes that sit awkwardly between courier pricing and a full removalist job.",
  },
  {
    title: "Business overflow",
    description:
      "Overflow stock, produce, or equipment when you need a real vehicle but not a dedicated fleet run.",
  },
];

const trustPoints = [
  {
    title: "Ranked matches, not a dead-end directory",
    description:
      "You start with the move need. moverrr ranks the strongest spare-capacity options instead of making you sift through an archive.",
  },
  {
    title: "Clear pricing before you commit",
    description:
      "Every match shows the customer total, route fit, and what is included so the decision stays simple and explainable.",
  },
  {
    title: "Proof-backed fulfilment",
    description:
      "Carrier verification, on-platform booking flow, and delivery proof all stay inside moverrr’s trust boundary.",
  },
];

export default async function HomePage() {
  const sampleDate = getTodayIsoDate();
  const showDevBanner = process.env.NODE_ENV === "development" && !hasSupabaseEnv();

  return (
    <main id="main-content" className="page-shell">
      <section className="grid gap-6 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <p className="section-label">Need-first spare-capacity marketplace</p>
          <h1 className="max-w-2xl text-4xl leading-tight text-text sm:text-5xl">
            Tell us the move. We&apos;ll rank the best spare-capacity matches.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
            moverrr is built for the awkward middle: furniture, appliances,
            boxes, and small business runs that are too big for parcel delivery
            and too small for a full dedicated truck.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#homepage-search"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white active:bg-[#0047b3]"
            >
              Start with your move
            </Link>
            <Link
              href="/become-a-carrier"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            >
              Post your first trip
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="surface-card flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label">How moverrr works</p>
                <h2 className="mt-1 text-xl text-text">Need first. Match second.</h2>
              </div>
              <span className="rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success">
                Ranked for clarity
              </span>
            </div>
            <p className="subtle-text">
              Carriers post trips they are already taking. You declare the route,
              timing, and move type. moverrr returns the strongest matches with a
              clear price, fit notes, and trust signals before you request a spot.
            </p>
          </div>

          <div id="homepage-search">
            <SearchBar />
          </div>
        </div>
      </section>

      {showDevBanner ? (
        <section>
          <ConfigBanner message="Add Supabase, Maps, and Stripe environment variables to switch this shell into the live MVP. The UI is ready, but the backend services need credentials." />
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-label">Built for the awkward middle</p>
            <h2 className="mt-1 text-2xl text-text">Examples moverrr should solve fast</h2>
          </div>
          <Link
            href={`/search?from=Penrith&to=Bondi&when=${sampleDate}&what=furniture`}
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-medium text-accent active:bg-accent/10"
          >
            Try a sample move
          </Link>
        </div>
        <div className="grid gap-3">
          {useCases.map((useCase) => (
            <div key={useCase.title} className="surface-card p-4">
              <h3 className="text-lg text-text">{useCase.title}</h3>
              <p className="mt-2 subtle-text">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-3">
        {trustPoints.map((point) => (
          <div key={point.title} className="surface-card p-4">
            <p className="section-label">Trust scaffold</p>
            <h2 className="mt-1 text-xl text-text">{point.title}</h2>
            <p className="mt-2 subtle-text">{point.description}</p>
          </div>
        ))}
      </section>

      <section className="surface-card flex flex-col gap-4 p-6">
        <div>
          <p className="section-label">For carriers</p>
          <h2 className="mt-1 text-2xl text-text">
            Post the trips you are already taking and fill spare room with better-fit jobs.
          </h2>
        </div>
        <p className="subtle-text">
          moverrr is not a quote board. Post your real run, set your rules, and
          only review requests that fit the trip you were already doing.
        </p>
        <div>
          <Link
            href="/become-a-carrier"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white active:bg-[#0047b3]"
          >
            Learn how carrier posting works
          </Link>
        </div>
      </section>
    </main>
  );
}
