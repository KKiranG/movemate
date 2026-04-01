import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierPerformanceStats } from "@/lib/data/bookings";

export default async function CarrierStatsPage() {
  const user = await requirePageSessionUser();
  const stats = await getCarrierPerformanceStats(user.id);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Performance"
        title="Track how your trips are performing"
        description="A lightweight quality loop for improving acceptance, completion, and repeat-route performance."
        actions={
          <Button asChild variant="secondary">
            <Link href="/carrier/dashboard">Back to dashboard</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="section-label">Acceptance rate</p>
          <p className="mt-2 text-3xl text-text">{stats.acceptanceRatePct}%</p>
          <p className="mt-1 text-sm text-text-secondary">Industry guide: 85%+</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Completion rate</p>
          <p className="mt-2 text-3xl text-text">{stats.completionRatePct}%</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Average rating</p>
          <p className="mt-2 text-3xl text-text">
            {stats.ratingCount > 0 ? stats.averageRating.toFixed(1) : "New"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Disputes</p>
          <p className="mt-2 text-3xl text-text">{stats.disputeCount}</p>
        </Card>
      </div>

      <Card className="p-4">
        <p className="section-label">Repeat-route usage</p>
        <div className="mt-4 grid gap-3">
          {stats.repeatRoutes.map(([corridor, count]) => (
            <div key={corridor} className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">{corridor}</p>
              <p className="mt-1 text-sm text-text-secondary">{count} bookings on this route</p>
            </div>
          ))}
          {stats.repeatRoutes.length === 0 ? (
            <p className="text-sm text-text-secondary">No repeat corridors yet.</p>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
