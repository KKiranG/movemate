import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierPerformanceStats } from "@/lib/data/bookings";

export default async function CarrierStatsPage() {
  const user = await requirePageSessionUser();
  const stats = await getCarrierPerformanceStats(user.id);
  const isNewCarrier =
    stats.ratingCount === 0 &&
    stats.disputeCount === 0 &&
    stats.repeatRoutes.length === 0 &&
    stats.acceptanceRatePct === 0 &&
    stats.completionRatePct === 0;

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

      {isNewCarrier ? (
        <Card className="border-accent/20 bg-accent/5 p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Unlock your performance profile</p>
              <h2 className="mt-1 text-lg text-text">Post a few trips to see your live stats</h2>
              <p className="mt-2 text-sm text-text-secondary">
                The dashboard will light up once your first completed bookings land.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Acceptance rate",
                "Completion rate",
                "Average rating",
                "Repeat corridors",
                "Monthly earnings",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-background p-3">
                  <p className="text-sm font-medium text-text">{item}</p>
                  <p className="mt-1 text-sm text-text-secondary">Unlock after your first completed jobs.</p>
                </div>
              ))}
            </div>
            <Button asChild>
              <Link href="/carrier/post">Post your first trip</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
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
        </>
      )}
    </main>
  );
}
