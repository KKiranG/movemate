import Link from "next/link";
import type { Metadata } from "next";

import { BootstrapDatasetForm } from "@/components/admin/bootstrap-dataset-form";
import { OpsFunnelCard } from "@/components/admin/ops-funnel-card";
import { requirePageAdminUser } from "@/lib/auth";
import {
  getAdminDashboardData,
  getFounderOpsCockpitData,
  getValidationMetrics,
} from "@/lib/data/admin";
import { PageIntro } from "@/components/layout/page-intro";
import { ReviewQueue } from "@/components/admin/review-queue";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin operations",
};

function AdminLoadFailureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-warning/30 bg-warning/5 p-4">
      <div className="space-y-2">
        <p className="section-label">Retry needed</p>
        <h2 className="text-lg text-text">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </Card>
  );
}

function formatMetricValue(
  metric: Awaited<ReturnType<typeof getValidationMetrics>>[number],
) {
  if (metric.kind === "percentage") {
    return `${metric.value}%`;
  }

  if (metric.kind === "currency") {
    return formatCurrency(metric.value);
  }

  return metric.value.toLocaleString("en-AU");
}

export default async function AdminDashboardPage() {
  await requirePageAdminUser();
  const [dashboardResult, cockpitResult] = await Promise.allSettled([
    getAdminDashboardData(),
    getFounderOpsCockpitData(),
  ]);
  const dashboardData =
    dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
  const cockpit = cockpitResult.status === "fulfilled" ? cockpitResult.value : null;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin operations"
        title="Manual-first operations control"
        description="Early MoveMate needs a human override for verification, disputes, and booking exceptions."
      />

      <p className="text-sm text-text-secondary">
        Last updated{" "}
        {dashboardData?.lastUpdatedAt
          ? new Date(dashboardData.lastUpdatedAt).toLocaleString("en-AU")
          : "No booking events yet"}
      </p>

      {dashboardData ? (
        <OpsFunnelCard metrics={dashboardData.metrics} />
      ) : (
        <AdminLoadFailureCard
          title="Ops funnel could not load"
          description="The top-line marketplace metrics failed to load, but the rest of admin operations is still available. Refresh to retry this section."
        />
      )}

      {dashboardData ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardData.metrics.map((metric) => (
            <Card key={metric.label} className="p-4">
              <p className="section-label">{metric.label}</p>
              <p className="mt-2 text-3xl text-text">
                {formatMetricValue(metric)}
              </p>
              {metric.helperText ? (
                <p className="mt-2 text-sm text-text-secondary">
                  {metric.helperText}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {cockpit ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Founder ops cockpit</p>
              <h2 className="mt-1 text-lg text-text">
                Top marketplace actions without a hunt
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                This collapses the current trust, payout, listing-quality, and
                booking-risk queues into one start-of-day surface.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/80 p-3">
                <p className="section-label">Verification</p>
                <p className="mt-2 text-2xl text-text">
                  {cockpit.headlineCounts.verification}
                </p>
              </Card>
              <Card className="border-border/80 p-3">
                <p className="section-label">Weak live listings</p>
                <p className="mt-2 text-2xl text-text">
                  {cockpit.headlineCounts.weakListings}
                </p>
              </Card>
              <Card className="border-border/80 p-3">
                <p className="section-label">Payout blockers</p>
                <p className="mt-2 text-2xl text-text">
                  {cockpit.headlineCounts.payoutBlockers}
                </p>
              </Card>
              <Card className="border-border/80 p-3">
                <p className="section-label">Risky bookings</p>
                <p className="mt-2 text-2xl text-text">
                  {cockpit.headlineCounts.riskyBookings}
                </p>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {cockpit.sections.map((section) => (
                <Card key={section.key} className="border-border/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="section-label">{section.title}</p>
                      <h3 className="mt-1 text-lg text-text">
                        {section.count} in queue
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {section.description}
                      </p>
                    </div>
                    {section.href ? (
                      <Link
                        href={section.href}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-accent active:opacity-80"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3">
                    {section.items.map((item) => {
                      const itemHref = "href" in item ? item.href : undefined;

                      return itemHref ? (
                        <Link
                          key={`${section.key}:${item.title}`}
                          href={itemHref}
                          className="block min-h-[44px] rounded-xl border border-border p-3 active:opacity-95"
                        >
                          <p className="text-sm font-medium text-text">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            {item.detail}
                          </p>
                        </Link>
                      ) : (
                        <div
                          key={`${section.key}:${item.title}`}
                          className="rounded-xl border border-border p-3"
                        >
                          <p className="text-sm font-medium text-text">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            {item.detail}
                          </p>
                        </div>
                      );
                    })}
                    {section.items.length === 0 ? (
                      <p className="text-sm text-text-secondary">
                        No items in this queue right now.
                      </p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <AdminLoadFailureCard
          title="Founder ops cockpit could not load"
          description="The individual queue snapshot failed to load, but the rest of admin operations is still available. Refresh to retry this section."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="section-label">Demand queue</p>
          <h2 className="mt-1 text-lg text-text">Alerts and unmatched demand</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Open the founder queue for unmatched requests, concierge offers, and matched-alert delivery logs.
          </p>
          <Link
            href="/admin/alerts"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-accent active:opacity-80"
          >
            Open alerts queue
          </Link>
        </Card>
        <Card className="p-4">
          <p className="section-label">Dispute review</p>
          <h2 className="mt-1 text-lg text-text">Proof-backed dispute decisions</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Review disputes against proof packs, booking timeline, and payment state instead of a shallow summary.
          </p>
          <Link
            href="/admin/disputes"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-accent active:opacity-80"
          >
            Open disputes
          </Link>
        </Card>
        <Card className="p-4">
          <p className="section-label">Activation gate</p>
          <h2 className="mt-1 text-lg text-text">Carrier go-live checklist</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Work the verification queue against identity, vehicle, route rules, and payout readiness.
          </p>
          <Link
            href="/admin/verification"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-accent active:opacity-80"
          >
            Open verification
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ReviewQueue />
        <Card className="p-4">
          <div className="space-y-3">
            <p className="section-label">Smoke dataset</p>
            <h2 className="text-lg text-text">Bootstrap local QA inventory</h2>
            <p className="subtle-text">
              Load deterministic trips and sample bookings without leaving the
              app.
            </p>
            <BootstrapDatasetForm />
          </div>
        </Card>
      </div>
    </main>
  );
}
