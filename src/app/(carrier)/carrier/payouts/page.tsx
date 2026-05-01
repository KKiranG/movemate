import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Banknote, Clock, Download, ShieldAlert } from "lucide-react";

import { ConnectPayoutButton } from "@/components/carrier/connect-payout-button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingPaymentLifecycleLabelFromState } from "@/lib/booking-presenters";
import { getCarrierPayoutDashboard } from "@/lib/data/bookings";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carrier payouts",
};

export default async function CarrierPayoutsPage() {
  const user = await requirePageSessionUser();
  const dashboard = await getCarrierPayoutDashboard(user.id);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const releasedThisMonthCents =
    dashboard.historyByMonth.find((entry) => entry.month === currentMonthKey)?.releasedCents ?? 0;
  const primaryHold = dashboard.payoutHolds[0];

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-elevated-2)] px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[calc(18px+var(--safe-area-top))]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Payouts</p>
          <h1 className="mt-1 [font-family:var(--font-display)] text-[32px] leading-[1.05] tracking-[-0.04em] text-text">
            {formatCurrency(dashboard.upcomingExpectedPayoutCents + dashboard.completedButUnreleasedCents)}
            <br />
            <span className="text-text-secondary">in motion.</span>
          </h1>
        </div>
        <Link href="/api/carrier/payouts/export" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text active:bg-[var(--bg-elevated-3)]" aria-label="Export CSV">
          <Download size={19} />
        </Link>
      </div>

      {!dashboard.payoutSetupReady ? (
        <Card className="mb-4 border-[var(--warning)]/30 bg-[var(--warning-subtle)] p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--warning)]">
            <ShieldAlert size={15} /> Payout setup missing
          </p>
          <h2 className="mt-2 text-[18px] font-semibold text-text">Funds can be held, but release is blocked</h2>
          <p className="mt-2 text-[13px] leading-5 text-text-secondary">
            Proof and customer confirmation still matter. Stripe Connect must be complete before release.
          </p>
          <div className="mt-4">
            <ConnectPayoutButton variant="secondary" label="Finish payout setup" />
          </div>
        </Card>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-2">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-[12px] font-semibold text-text-secondary"><Clock size={14} /> In progress</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] tabular text-text">{formatCurrency(dashboard.upcomingExpectedPayoutCents)}</p>
          <p className="mt-1 text-[12px] text-text-secondary">If open jobs complete.</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-[12px] font-semibold text-text-secondary"><Banknote size={14} /> Released this month</p>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] tabular text-text">{formatCurrency(releasedThisMonthCents)}</p>
          <p className="mt-1 text-[12px] text-text-secondary">Captured or released.</p>
        </Card>
      </div>

      {primaryHold ? (
        <Card className="mb-5 overflow-hidden p-0">
          <div className="bg-[var(--text-primary)] px-4 py-3 text-[var(--bg-base)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em]">Pending release</p>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-text">{primaryHold.bookingReference}</h2>
                <p className="mt-1 text-[13px] text-text-secondary">{primaryHold.stage} · {primaryHold.missingStep}</p>
              </div>
              <p className="text-[22px] font-semibold tabular text-text">{formatCurrency(primaryHold.heldCents)}</p>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-text-secondary">{primaryHold.explanation}</p>
            <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.12em] text-text-secondary">Clears when</p>
            <p className="mt-1 text-[13px] font-semibold text-text">{primaryHold.nextAction}</p>
            {primaryHold.ctaHref ? (
              <Link href={primaryHold.ctaHref} className="mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-[22px] bg-[var(--text-primary)] px-4 text-[15px] font-semibold text-[var(--bg-base)]">
                {primaryHold.ctaLabel ?? "Open"} <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="mb-5 p-4">
          <h2 className="text-[16px] font-semibold text-text">No payout holds</h2>
          <p className="mt-2 text-[13px] leading-5 text-text-secondary">
            Proof-backed completed jobs will appear here until confirmation and release are complete.
          </p>
        </Card>
      )}

      <section className="mb-5">
        <p className="eyebrow mb-3">Paid</p>
        <div className="space-y-2">
          {dashboard.historyByMonth.length === 0 ? (
            <Card className="p-4">
              <p className="text-[13px] text-text-secondary">Monthly payout history appears after the first completed booking.</p>
            </Card>
          ) : null}
          {dashboard.historyByMonth.map((entry) => (
            <Card key={entry.month} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-text">{entry.month}</p>
                  <p className="mt-1 text-[12px] text-text-secondary">{entry.jobCount} jobs · refunded {formatCurrency(entry.refundedCents)}</p>
                </div>
                <p className="text-[18px] font-semibold tabular text-[var(--success)]">{formatCurrency(entry.releasedCents)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {dashboard.ledgerEntries.length > 0 ? (
        <section>
          <p className="eyebrow mb-3">Ledger</p>
          <div className="space-y-2">
            {dashboard.ledgerEntries.slice(0, 8).map((entry) => (
              <Card key={entry.bookingId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-text">{entry.bookingReference}</p>
                    <p className="mt-1 text-[12px] text-text-secondary">{entry.tripDate ?? "No trip date"} · {entry.routeLabel}</p>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      {getBookingPaymentLifecycleLabelFromState({
                        bookingStatus:
                          entry.payoutStatus === "captured" || entry.payoutStatus === "refunded"
                            ? "completed"
                            : "delivered",
                        paymentStatus: entry.payoutStatus,
                      })}
                    </p>
                  </div>
                  <p className="text-[16px] font-semibold tabular text-text">{formatCurrency(entry.carrierPayoutCents)}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
