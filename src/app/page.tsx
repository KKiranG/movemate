import Link from "next/link";

import { ConfigBanner } from "@/components/shared/config-banner";
import { SearchBar } from "@/components/search/search-bar";
import { TripCard } from "@/components/trip/trip-card";
import { hasSupabaseEnv } from "@/lib/env";
import { listPublicTrips } from "@/lib/data/trips";
import { getTodayIsoDate } from "@/lib/utils";

const useCases = [
  {
    title: "Marketplace pickups",
    description:
      "Bought a sofa in Penrith and need it in Bondi without paying full removalist rates.",
  },
  {
    title: "Student moves",
    description:
      "A desk, a bookshelf, and a few boxes fit the awkward middle better than a whole truck.",
  },
  {
    title: "Business overflow",
    description:
      "Small runs for stock, produce, and equipment when dedicated courier pricing makes no sense.",
  },
];

export default async function HomePage() {
  const featuredTrips = await listPublicTrips(3);
  const sampleDate = getTodayIsoDate();

  return (
    <main id="main-content" className="page-shell">
      <section className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col gap-3">
          <p className="section-label">Sydney spare-capacity marketplace</p>
          <h1 className="max-w-2xl text-4xl leading-tight text-text sm:text-5xl">
            Browse posted truck space instead of waiting for quotes.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
            moverrr is built for the awkward middle: sofas, desks, appliances,
            boxes, and small business runs that are too big for couriers and too
            small for a full removalist booking.
          </p>
        </div>

        <div className="surface-card flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Why this works</p>
              <h2 className="mt-1 text-xl text-text">Inventory first</h2>
            </div>
            <span className="rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success">
              Browse in seconds
            </span>
          </div>
          <p className="subtle-text">
            Carriers post where they are already going and how much space they
            have. Customers browse that inventory and book into it with a clear
            price, route, and time window upfront.
          </p>
        </div>

        <SearchBar />

        {!hasSupabaseEnv() ? (
          <ConfigBanner message="Add Supabase, Maps, and Stripe environment variables to switch this shell into the live MVP. The UI is ready, but the backend services need credentials." />
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-label">Built for MVP validation</p>
            <h2 className="mt-1 text-2xl text-text">The jobs we need to win</h2>
          </div>
          <Link
            href={`/search?from=Penrith&to=Bondi&when=${sampleDate}&what=furniture`}
            className="text-sm font-medium text-accent"
          >
            View sample search
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

      <section className="flex flex-col gap-4 pb-10">
        <div>
          <p className="section-label">Example inventory</p>
          <h2 className="mt-1 text-2xl text-text">Trips customers can book now</h2>
        </div>
        <div className="grid gap-4">
          {featuredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} href={`/trip/${trip.id}`} />
          ))}
        </div>
        {featuredTrips.length === 0 ? (
          <div className="surface-card p-4">
            <p className="subtle-text">
              No live trips yet. Carrier onboarding and trip posting are now wired, so this section
              will populate from real listings once supply is added.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
