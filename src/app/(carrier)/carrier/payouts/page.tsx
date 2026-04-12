import Link from "next/link";
import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { ConnectPayoutButton } from "@/components/carrier/connect-payout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
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
    <main id="main-content" className="page-shell">
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
              <Link href="/carrier/dashboard">Back to carrier home</Link>
            </Button>
          </div>
        }
      />

      {!dashboard.payoutSetupReady ? (
        <Card className="border-warning/20 bg-warning/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-label">Payout setup missing</p>
              <h2 className="mt-1 text-lg text-text">Funds can be held, but release is blocked</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Booking money stays protected inside moverrr until proof, customer confirmation, and
                payout setup all line up. Finish payout setup before your next completed job.
              </p>
              <p className="mt-2 text-sm text-text">
                What happens next: eligible bookings keep stacking in payout holds until onboarding is complete.
              </p>
            </div>
            <ConnectPayoutButton variant="secondary" label="Finish payout setup" />
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="section-label">In progress</p>
          <p className="mt-1 text-sm text-text-secondary">Estimated earnings if open jobs complete.</p>
          <p className="mt-2 text-3xl text-text">
            {formatCurrency(dashboard.upcomingExpectedPayoutCents)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Completed, awaiting release</p>
          <p className="mt-1 text-sm text-text-secondary">Jobs are done but funds have not been captured yet.</p>
          <p className="mt-2 text-3xl text-text">
            {formatCurrency(dashboard.completedButUnreleasedCents)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Refunded jobs</p>
          <p className="mt-1 text-sm text-text-secondary">Cancelled or refunded before payout.</p>
          <p className="mt-2 text-3xl text-text">{dashboard.refundedJobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Released this month</p>
          <p className="mt-1 text-sm text-text-secondary">Payouts captured or released in the current history window.</p>
          <p className="mt-2 text-3xl text-text">{formatCurrency(releasedThisMonthCents)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Payout holds</p>
            <h2 className="mt-1 text-lg text-text">What is still blocking release</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Each held amount shows the missing step, the balance still waiting, and what happens
              next.
            </p>
          </div>
          {dashboard.payoutHolds.length > 0 ? (
            <div className="grid gap-3">
              {dashboard.payoutHolds.map((hold) => (
                <div key={hold.bookingId} className="rounded-xl border border-border p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">{hold.bookingReference}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {hold.stage} · {hold.missingStep}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-text">
                      Held {formatCurrency(hold.heldCents)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary">{hold.explanation}</p>
                  <p className="mt-2 text-sm text-text">{hold.nextAction}</p>
                  {hold.ctaHref ? (
                    <Button asChild variant="secondary" className="mt-3">
                      <Link href={hold.ctaHref}>{hold.ctaLabel ?? "Open"}</Link>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              No active payout holds right now. Once proof, confirmation, and capture clear, release
              lands in the history below.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <p className="section-label">History by month</p>
        <div className="mt-4 grid gap-3">
          {dashboard.historyByMonth.length === 0 ? (
            <p className="text-sm text-text-secondary">
              Once a booking is completed, captured payouts will appear here by month.
            </p>
          ) : null}
          {dashboard.historyByMonth.map((entry) => (
            <div key={entry.month} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text">{entry.month}</p>
                <p className="text-sm text-text-secondary">{entry.jobCount} jobs</p>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Released {formatCurrency(entry.releasedCents)} · Refunded {formatCurrency(entry.refundedCents)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="section-label">Ledger</p>
        <h2 className="mt-1 text-lg text-text">Line-by-line payout math</h2>
        <div className="mt-4 grid gap-3">
          {dashboard.ledgerEntries.map((entry) => (
            <div key={entry.bookingId} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">{entry.bookingReference}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {entry.tripDate ?? "No trip date"} · {entry.routeLabel}
                  </p>
                </div>
                <p className="text-sm text-text-secondary capitalize">
                  {entry.payoutStatus.replaceAll("_", " ")}
                </p>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-text-secondary sm:grid-cols-2">
                <p>Base earnings: {formatCurrency(entry.basePriceCents)}</p>
                <p>Booking fee: {formatCurrency(entry.bookingFeeCents)}</p>
                <p>15% commission: -{formatCurrency(entry.platformCommissionCents)}</p>
                <p className="font-medium text-text">Net payout: {formatCurrency(entry.carrierPayoutCents)}</p>
              </div>
            </div>
          ))}
          {dashboard.ledgerEntries.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No payout ledger lines yet. Completed or in-flight bookings will appear here.
            </p>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
