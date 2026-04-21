import Link from "next/link";
import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { ConnectPayoutButton } from "@/components/carrier/connect-payout-button";
import { Button } from "@/components/ui/button";
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

  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="Payouts"
        title="See what is earned, pending, and refunded"
        description="Transparency around payouts is part of the trust loop for repeat carriers."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/api/carrier/payouts/export">Export CSV</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/carrier/today">Open today screen</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/carrier">Back to carrier home</Link>
            </Button>
          </div>
        }
      />

      {!dashboard.payoutSetupReady ? (
        <Card className="border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Payout setup missing</p>
              <h2 className="mt-1 text-lg text-[var(--text-primary)]">Funds can be held, but release is blocked</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Booking money stays protected inside MoveMate until proof, customer confirmation, and
                payout setup all line up. Finish payout setup before your next completed job.
              </p>
              <p className="mt-2 text-sm text-[var(--text-primary)]">
                What happens next: eligible bookings keep stacking in payout holds until onboarding is complete.
              </p>
            </div>
            <ConnectPayoutButton variant="secondary" label="Finish payout setup" />
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="eyebrow">In progress</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Estimated earnings if open jobs complete.</p>
          <p className="mt-2 text-3xl text-[var(--text-primary)]">
            {formatCurrency(dashboard.upcomingExpectedPayoutCents)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Completed, awaiting release</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Jobs are done but funds have not been captured yet.</p>
          <p className="mt-2 text-3xl text-[var(--text-primary)]">
            {formatCurrency(dashboard.completedButUnreleasedCents)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Refunded jobs</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Cancelled or refunded before payout.</p>
          <p className="mt-2 text-3xl text-[var(--text-primary)]">{dashboard.refundedJobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Released this month</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Payouts captured or released in the current history window.</p>
          <p className="mt-2 text-3xl text-[var(--text-primary)]">{formatCurrency(releasedThisMonthCents)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="eyebrow">Payout holds</p>
            <h2 className="mt-1 text-lg text-[var(--text-primary)]">What is still blocking release</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Each held amount shows the missing step, the balance still waiting, and what happens
              next.
            </p>
          </div>
          {dashboard.payoutHolds.length > 0 ? (
            <div className="grid gap-3">
              {dashboard.payoutHolds.map((hold) => (
                <div key={hold.bookingId} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{hold.bookingReference}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {hold.stage} · {hold.missingStep}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Held {formatCurrency(hold.heldCents)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{hold.explanation}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    Clears when
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{hold.nextAction}</p>
                  {hold.ctaHref ? (
                    <Button asChild variant="secondary" className="mt-3">
                      <Link href={hold.ctaHref}>{hold.ctaLabel ?? "Open"}</Link>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No active payout holds right now. Once proof, confirmation, and capture clear, release
              lands in the history below.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <p className="eyebrow">History by month</p>
        <div className="mt-4 grid gap-3">
          {dashboard.historyByMonth.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Once a booking is completed, captured payouts will appear here by month.
            </p>
          ) : null}
          {dashboard.historyByMonth.map((entry) => (
            <div key={entry.month} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">{entry.month}</p>
                <p className="text-sm text-[var(--text-secondary)]">{entry.jobCount} jobs</p>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Released {formatCurrency(entry.releasedCents)} · Refunded {formatCurrency(entry.refundedCents)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="eyebrow">Ledger</p>
        <h2 className="mt-1 text-lg text-[var(--text-primary)]">Line-by-line payout math</h2>
        <div className="mt-4 grid gap-3">
          {dashboard.ledgerEntries.map((entry) => (
            <div key={entry.bookingId} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{entry.bookingReference}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {entry.tripDate ?? "No trip date"} · {entry.routeLabel}
                  </p>
                </div>
                <p className="text-sm text-[var(--text-secondary)] capitalize">
                  {getBookingPaymentLifecycleLabelFromState({
                    bookingStatus:
                      entry.payoutStatus === "captured" || entry.payoutStatus === "refunded"
                        ? "completed"
                        : "delivered",
                    paymentStatus: entry.payoutStatus,
                  })}
                </p>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
                <p>Base route earnings: {formatCurrency(entry.basePriceCents)}</p>
                {entry.adjustmentFeeCents > 0 ? (
                  <p>Condition adjustment accepted: {formatCurrency(entry.adjustmentFeeCents)}</p>
                ) : null}
                <p>Platform fee paid by customer: {formatCurrency(entry.platformFeeCents)}</p>
                <p>GST paid by customer: {formatCurrency(entry.gstCents)}</p>
                <p className="font-medium text-[var(--text-primary)]">Net payout: {formatCurrency(entry.carrierPayoutCents)}</p>
              </div>
            </div>
          ))}
          {dashboard.ledgerEntries.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No payout ledger lines yet. Completed or in-flight bookings will appear here.
            </p>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
