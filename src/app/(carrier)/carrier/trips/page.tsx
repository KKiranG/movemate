import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarCheck2, Clock, Plus, Route } from "lucide-react";

import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { listCarrierTrips } from "@/lib/data/trips";

export const metadata: Metadata = {
  title: "Carrier trips",
};

type CarrierTripList = Awaited<ReturnType<typeof listCarrierTrips>>;

function TripCard({ trip, compact = false }: { trip: CarrierTripList[number]; compact?: boolean }) {
  const statusLabel = trip.status?.replaceAll("_", " ") ?? "active";
  const href = compact ? `/carrier/trips/${trip.id}/runsheet` : `/carrier/trips/${trip.id}`;

  return (
    <Link href={href} className="block">
      <Card className="p-4 active:bg-[var(--bg-elevated-3)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--bg-elevated-2)]">
            <Route size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-text">{trip.route.label}</p>
            <p className="mt-1 text-[12px] text-text-secondary">{trip.tripDate} · {trip.timeWindow}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-semibold capitalize text-[var(--success)]">{statusLabel}</p>
            <p className="mt-1 text-[11px] text-text-secondary">{trip.remainingCapacityPct}% space</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default async function CarrierTripsPage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  },
) {
  const searchParams = await props.searchParams;
  const user = await requirePageSessionUser();
  const trips = await listCarrierTrips(user.id);
  const posted = searchParams?.posted === "1";
  const liveTrips = trips.filter((trip) => ["active", "booked_partial"].includes(trip.status ?? "active"));
  const draftTrips = trips.filter((trip) => trip.status === "draft");
  const archivedTrips = trips.filter((trip) =>
    ["paused", "cancelled", "expired", "booked_full"].includes(trip.status ?? ""),
  );
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayTrips = liveTrips.filter((trip) => trip.tripDate === todayIso);

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-elevated-2)] px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[calc(18px+var(--safe-area-top))]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Trips</p>
          <h1 className="mt-1 [font-family:var(--font-display)] text-[32px] leading-[1.05] tracking-[-0.04em] text-text">
            {todayTrips.length > 0 ? "Today is active." : liveTrips.length > 0 ? "Live routes." : "Post a route."}
          </h1>
        </div>
        <Link href="/carrier/trips/new" className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] active:opacity-80" aria-label="Post a route">
          <Plus size={20} />
        </Link>
      </div>

      {posted ? (
        <Card className="mb-4 border-[var(--success)]/20 bg-[var(--success-subtle)] p-4">
          <p className="text-[14px] font-semibold text-[var(--success)]">Trip posted successfully</p>
          <p className="mt-1 text-[12.5px] text-text-secondary">Your route is live. Watch Today and Requests for matched jobs.</p>
        </Card>
      ) : null}

      {todayTrips.length > 0 ? (
        <section className="mb-5">
          <p className="eyebrow mb-3">Today</p>
          <div className="space-y-2">
            {todayTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} compact />
            ))}
          </div>
        </section>
      ) : null}

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Live", value: liveTrips.length, icon: CalendarCheck2 },
            { label: "Drafts", value: draftTrips.length, icon: Clock },
            { label: "Archive", value: archivedTrips.length, icon: Route },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <Icon className="mx-auto text-text-secondary" size={17} />
              <p className="mt-2 text-[22px] font-semibold tabular text-text">{value}</p>
              <p className="mt-1 text-[11px] text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {liveTrips.length > 0 ? (
        <section className="mb-5">
          <p className="eyebrow mb-3">Live trips</p>
          <div className="space-y-2">
            {liveTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      ) : null}

      {draftTrips.length > 0 ? (
        <section className="mb-5">
          <p className="eyebrow mb-3">Drafts</p>
          <div className="space-y-2">
            {draftTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      ) : null}

      {archivedTrips.length > 0 ? (
        <section className="mb-5">
          <p className="eyebrow mb-3">Past and paused</p>
          <div className="space-y-2">
            {archivedTrips.slice(0, 6).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      ) : null}

      {trips.length === 0 ? (
        <Card className="p-5 text-center">
          <h2 className="text-[18px] font-semibold text-text">Post your first route</h2>
          <p className="mt-2 text-[13px] leading-5 text-text-secondary">Tell MoveMate where you are already driving. Matching starts from live supply.</p>
          <Link href="/carrier/trips/new" className="mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[22px] bg-[var(--text-primary)] px-5 text-[15px] font-semibold text-[var(--bg-base)]">
            Post route <ArrowRight size={16} />
          </Link>
        </Card>
      ) : null}
    </main>
  );
}
