import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierTodaySnapshot } from "@/lib/data/bookings";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Today | Carrier",
  description:
    "Carrier operations view for proof gaps, pending decisions, customer confirmation, and payout blockers.",
};

function formatTripDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getActionCardTone(count: number, urgency: "urgent" | "watch") {
  if (count === 0) {
    return "border-border bg-background";
  }

  return urgency === "urgent"
    ? "border-warning/30 bg-warning/10"
    : "border-accent/20 bg-accent/5";
}

export default async function CarrierTodayPage() {
  const user = await requirePageSessionUser();
  const snapshot = await getCarrierTodaySnapshot(user.id);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Today"
        title="Run today’s work before it turns into cleanup"
        description="Manual-first ops view for pending decisions, proof gaps, customer confirmation, and payout blockers."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/carrier/dashboard">Back to carrier home</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/carrier/payouts">Open payouts</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {snapshot.todayActions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className={`block min-h-[44px] rounded-2xl border p-4 active:opacity-95 ${getActionCardTone(action.count, action.urgency)}`}
          >
            <p className="text-sm font-medium text-text">{action.title}</p>
            <p className="mt-2 text-3xl text-text">{action.count}</p>
            <p className="mt-2 text-sm text-text-secondary">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Trip health</p>
              <h2 className="mt-1 text-lg text-text">Which active routes need attention</h2>
              <p className="mt-1 text-sm text-text-secondary">
                The score is deterministic and only moves when proof, payout, dispute, or expiry risk changes.
              </p>
            </div>
            <div className="grid gap-3">
              {snapshot.tripHealth.map((trip) => (
                <Link
                  key={trip.tripId}
                  href={trip.href}
                  className="block min-h-[44px] rounded-xl border border-border p-3 active:opacity-95"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">{trip.routeLabel}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {formatTripDate(trip.tripDate)} · {trip.tier} · {trip.score}/100
                      </p>
                    </div>
                    <p className="text-sm font-medium text-text">{trip.reasons.length} issue{trip.reasons.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {trip.reasons.map((reason) => (
                      <p key={reason} className="text-sm text-text-secondary">
                        {reason}
                      </p>
                    ))}
                  </div>
                </Link>
              ))}
              {snapshot.tripHealth.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No active routes yet. Post a trip to start seeing today-level health checks on carrier home.
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Payout blockers</p>
              <h2 className="mt-1 text-lg text-text">What is still holding money back</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Every hold shows the amount, the missing step, what happens next, and where to fix it.
              </p>
            </div>
            <div className="grid gap-3">
              {snapshot.payoutHolds.map((hold) => (
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
                  <Button asChild variant="secondary" className="mt-3">
                    <Link href={hold.ctaHref}>{hold.ctaLabel}</Link>
                  </Button>
                </div>
              ))}
              {snapshot.payoutHolds.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No payout blockers right now. Keep proof and customer confirmation moving and payout release should stay clean.
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
