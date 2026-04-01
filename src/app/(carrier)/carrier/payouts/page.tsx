import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierPayoutDashboard } from "@/lib/data/bookings";
import { formatCurrency } from "@/lib/utils";

export default async function CarrierPayoutsPage() {
  const user = await requirePageSessionUser();
  const dashboard = await getCarrierPayoutDashboard(user.id);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Payouts"
        title="See what is earned, pending, and refunded"
        description="Transparency around payouts is part of the trust loop for repeat carriers."
        actions={
          <Button asChild variant="secondary">
            <Link href="/carrier/dashboard">Back to dashboard</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="section-label">Upcoming expected payout</p>
          <p className="mt-2 text-3xl text-text">
            {formatCurrency(dashboard.upcomingExpectedPayoutCents)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Completed, not released</p>
          <p className="mt-2 text-3xl text-text">
            {formatCurrency(dashboard.completedButUnreleasedCents)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Refunded jobs</p>
          <p className="mt-2 text-3xl text-text">{dashboard.refundedJobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Historical months</p>
          <p className="mt-2 text-3xl text-text">{dashboard.historyByMonth.length}</p>
        </Card>
      </div>

      <Card className="p-4">
        <p className="section-label">History by month</p>
        <div className="mt-4 grid gap-3">
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
    </main>
  );
}
