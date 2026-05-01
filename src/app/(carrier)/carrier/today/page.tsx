import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2, DollarSign, Map, Plus, Route } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Wordmark } from "@/components/ui/wordmark";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierTodaySnapshot } from "@/lib/data/bookings";
import { listCarrierRequestCards } from "@/lib/data/booking-requests";
import { listCarrierTrips } from "@/lib/data/trips";
import { formatCurrency } from "@/lib/utils";

export default async function CarrierTodayPage() {
  const user = await requirePageSessionUser();
  const [requests, trips, snapshot] = await Promise.all([
    listCarrierRequestCards(user.id),
    listCarrierTrips(user.id, { activeOnly: true }),
    getCarrierTodaySnapshot(user.id),
  ]);
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayTrips = trips.filter((trip) => trip.tripDate === todayIso);
  const firstRequest = requests[0];
  const firstTrip = todayTrips[0] ?? trips[0];
  const payoutHold = snapshot.payoutHolds[0];
  const nextHref = firstRequest
    ? `/carrier/requests/${firstRequest.id}`
    : firstTrip
      ? `/carrier/trips/${firstTrip.id}/runsheet`
      : payoutHold?.ctaHref ?? "/carrier/trips/new";

  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg-elevated-2)] pb-[calc(96px+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between px-5 pt-[calc(14px+var(--safe-area-top))]">
        <Wordmark color="var(--text-primary)" />
        <span className="rounded-full bg-[var(--success-subtle)] px-3 py-1 text-[12px] font-semibold text-[var(--success)]">
          Verified
        </span>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-6">
        {firstRequest ? (
          <Link href={`/carrier/requests/${firstRequest.id}`} className="mb-4 flex min-h-[60px] items-center justify-between rounded-[18px] bg-[var(--text-primary)] px-4 text-[var(--bg-base)] shadow-[var(--shadow-card)] active:opacity-80">
            <span>
              <span className="block text-[13px] font-bold uppercase tracking-[0.12em]">New request</span>
              <span className="mt-1 block text-[13px] opacity-75">{firstRequest.itemDescription} · {formatCurrency(firstRequest.carrierPayoutCents)} payout</span>
            </span>
            <ArrowRight size={18} />
          </Link>
        ) : null}

        <p className="eyebrow">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}</p>
        <h1 className="mt-2 [font-family:var(--font-display)] text-[34px] leading-[1.05] tracking-[-0.04em] text-text">
          {firstRequest
            ? "1 request waiting."
            : firstTrip
              ? "Runsheet ready."
              : payoutHold
                ? "Payout needs attention."
                : "Post your next route."}
          <br />
          <span className="text-text-secondary">
            {firstRequest
              ? "Review fit before it expires."
              : firstTrip
                ? "Keep proof and stops visible."
                : payoutHold
                  ? "Clear the blocker to release funds."
                  : "Get matched to nearby demand."}
          </span>
        </h1>

        <Card className="mt-5 overflow-hidden p-0">
          <div className="flex items-center justify-between bg-[var(--text-primary)] px-4 py-3 text-[var(--bg-base)]">
            <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]">
              <Route size={15} /> Most urgent
            </span>
            <span className="text-[12px] opacity-75">
              {firstRequest ? formatCurrency(firstRequest.carrierPayoutCents) : payoutHold ? formatCurrency(payoutHold.heldCents) : "live route"}
            </span>
          </div>
          <div className="p-4">
            {firstRequest ? (
              <>
                <h2 className="text-[17px] font-semibold text-text">{firstRequest.itemDescription}</h2>
                <p className="mt-2 text-[13px] leading-5 text-text-secondary">
                  {firstRequest.pickupSuburb} to {firstRequest.dropoffSuburb}
                </p>
                <p className="mt-2 text-[13px] leading-5 text-text-secondary">{firstRequest.fitExplanation} {firstRequest.accessSummary}</p>
              </>
            ) : firstTrip ? (
              <>
                <h2 className="text-[17px] font-semibold text-text">{firstTrip.route.label}</h2>
                <p className="mt-2 text-[13px] leading-5 text-text-secondary">{firstTrip.tripDate} · {firstTrip.timeWindow} · remaining {firstTrip.remainingCapacityPct}%</p>
              </>
            ) : payoutHold ? (
              <>
                <h2 className="text-[17px] font-semibold text-text">{payoutHold.bookingReference}</h2>
                <p className="mt-2 text-[13px] leading-5 text-text-secondary">{payoutHold.explanation}</p>
              </>
            ) : (
              <>
                <h2 className="text-[17px] font-semibold text-text">No live route yet</h2>
                <p className="mt-2 text-[13px] leading-5 text-text-secondary">Tell MoveMate where you are already driving and get matched to compatible customer requests.</p>
              </>
            )}
            <Link href={nextHref} className="mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-[20px] bg-[var(--text-primary)] px-4 text-[15px] font-semibold text-[var(--bg-base)] active:opacity-80">
              {firstRequest ? "Review request" : firstTrip ? "Open runsheet" : payoutHold ? "Open payout blocker" : "Post a route"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[24px] border border-border bg-surface">
          {[
            { label: "Today", value: todayTrips.length || trips.length, icon: Route },
            { label: "Proof", value: snapshot.todayActions.find((action) => action.key.includes("proof"))?.count ?? 0, icon: Camera },
            { label: "Payout", value: snapshot.payoutHolds.length, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="border-r border-border p-3 text-center last:border-r-0">
              <Icon className="mx-auto text-text-secondary" size={17} />
              <p className="mt-2 text-[20px] font-semibold tabular text-text">{value}</p>
              <p className="mt-1 text-[11px] text-text-secondary">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {snapshot.todayActions.filter((action) => action.count > 0).slice(0, 3).map((action) => (
            <Link key={action.key} href={action.href} className="flex min-h-[58px] items-center gap-3 rounded-[18px] border border-border bg-surface px-4 active:bg-[var(--bg-elevated-3)]">
              <CheckCircle2 size={19} className="text-[var(--success)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-text">{action.title}</span>
                <span className="mt-1 block text-[12px] text-text-secondary">{action.description}</span>
              </span>
              <ArrowRight size={16} className="text-text-secondary" />
            </Link>
          ))}
          <Link href="/carrier/trips/new" className="flex min-h-[58px] items-center gap-3 rounded-[18px] border border-dashed border-[var(--border-strong)] px-4 active:bg-surface">
            <Plus size={19} />
            <span className="flex-1 text-[14px] font-semibold text-text">Post next route</span>
            <ArrowRight size={16} className="text-text-secondary" />
          </Link>
          <Link href="/carrier/trips" className="flex min-h-[58px] items-center gap-3 rounded-[18px] border border-border bg-surface px-4 active:bg-[var(--bg-elevated-3)]">
            <Map size={19} />
            <span className="flex-1 text-[14px] font-semibold text-text">View trips</span>
            <ArrowRight size={16} className="text-text-secondary" />
          </Link>
        </div>
      </div>
    </main>
  );
}
