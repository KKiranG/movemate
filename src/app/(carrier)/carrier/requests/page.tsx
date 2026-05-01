import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bell, Clock, Route, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import {
  listCarrierRecentRequestOutcomeCards,
  listCarrierRequestCards,
} from "@/lib/data/booking-requests";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carrier requests",
  description: "Review open customer requests that still need a carrier decision.",
};

export default async function CarrierRequestsPage() {
  const user = await requirePageSessionUser();
  const [requests, recentOutcomes] = await Promise.all([
    listCarrierRequestCards(user.id),
    listCarrierRecentRequestOutcomeCards(user.id),
  ]);
  const firstRequest = requests[0];

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-elevated-2)] px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[calc(18px+var(--safe-area-top))]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow">Requests</p>
          <h1 className="mt-1 [font-family:var(--font-display)] text-[32px] leading-[1.05] tracking-[-0.04em] text-text">
            {requests.length > 0 ? `${requests.length} awaiting response.` : "No open requests."}
          </h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text">
          <Bell size={19} />
        </div>
      </div>

      {firstRequest ? (
        <Link href={`/carrier/requests/${firstRequest.id}`} className="block">
          <Card className="overflow-hidden p-0 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between bg-[var(--warning-subtle)] px-4 py-3">
              <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--warning)]">
                <Clock size={15} /> Respond before expiry
              </span>
              <span className="text-[13px] font-semibold tabular text-[var(--warning)]">{firstRequest.typeLabel}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-semibold leading-tight text-text">{firstRequest.itemDescription}</h2>
                  <p className="mt-2 text-[13px] leading-5 text-text-secondary">
                    {firstRequest.pickupSuburb} to {firstRequest.dropoffSuburb}
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-text-secondary">{firstRequest.accessSummary}</p>
                </div>
                <div className="text-right">
                  <p className="text-[26px] font-semibold tracking-[-0.04em] tabular text-text">{formatCurrency(firstRequest.carrierPayoutCents)}</p>
                  <p className="text-[11px] text-text-secondary">payout</p>
                </div>
              </div>
              <div className="mt-4 rounded-[16px] bg-[var(--bg-elevated-2)] p-3">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-text">
                  <Route size={15} /> {firstRequest.fitExplanation}
                </p>
              </div>
              <div className="mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-[22px] bg-[var(--text-primary)] px-4 text-[15px] font-semibold text-[var(--bg-base)]">
                Review request <ArrowRight size={16} />
              </div>
            </div>
          </Card>
        </Link>
      ) : (
        <Card className="p-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-subtle)] text-[var(--success)]">
            <ShieldCheck size={24} />
          </div>
          <h2 className="mt-4 text-[18px] font-semibold text-text">You are clear for now</h2>
          <p className="mt-2 text-[13px] leading-5 text-text-secondary">
            New requests will appear with route fit, access, payout, and one structured clarification path.
          </p>
          <Link href="/carrier/today" className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-[20px] bg-[var(--text-primary)] px-5 text-[14px] font-semibold text-[var(--bg-base)]">
            Back to Today
          </Link>
        </Card>
      )}

      {requests.length > 1 ? (
        <div className="mt-5">
          <p className="eyebrow mb-3">More waiting</p>
          <div className="space-y-2">
            {requests.slice(1).map((request) => (
              <Link key={request.id} href={`/carrier/requests/${request.id}`} className="flex min-h-[72px] items-center gap-3 rounded-[18px] border border-border bg-surface p-4 active:bg-[var(--bg-elevated-3)]">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-text">{request.itemDescription}</p>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    {request.pickupSuburb} to {request.dropoffSuburb}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-semibold tabular text-text">{formatCurrency(request.carrierPayoutCents)}</p>
                  <p className="mt-1 text-[11px] text-text-secondary">Review</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {recentOutcomes.length > 0 ? (
        <div className="mt-6">
          <p className="eyebrow mb-3">Recent outcomes</p>
          <div className="space-y-2">
            {recentOutcomes.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-text">{request.itemDescription}</p>
                    <p className="mt-1 text-[12px] text-text-secondary">{request.routeLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">{request.status.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-[11px] text-text-secondary">{formatDateTime(request.respondedAt)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
