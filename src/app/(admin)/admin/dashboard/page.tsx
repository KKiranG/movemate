import { BootstrapDatasetForm } from "@/components/admin/bootstrap-dataset-form";
import { requirePageAdminUser } from "@/lib/auth";
import { getValidationMetrics } from "@/lib/data/admin";
import { PageIntro } from "@/components/layout/page-intro";
import { ReviewQueue } from "@/components/admin/review-queue";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

function formatMetricValue(metric: Awaited<ReturnType<typeof getValidationMetrics>>[number]) {
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
  const metrics = await getValidationMetrics();
  const lastUpdated = new Date();

  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="Admin dashboard"
        title="Manual-first operations control"
        description="Early moverrr needs a human override for verification, disputes, and booking exceptions."
      />

      <p className="text-sm text-text-secondary">
        Last updated {lastUpdated.toLocaleString("en-AU")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <p className="section-label">{metric.label}</p>
            <p className="mt-2 text-3xl text-text">{formatMetricValue(metric)}</p>
            {metric.helperText ? (
              <p className="mt-2 text-sm text-text-secondary">{metric.helperText}</p>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ReviewQueue />
        <Card className="p-4">
          <div className="space-y-3">
            <p className="section-label">Smoke dataset</p>
            <h2 className="text-lg text-text">Bootstrap local QA inventory</h2>
            <p className="subtle-text">
              Load deterministic trips and sample bookings without leaving the app.
            </p>
            <BootstrapDatasetForm />
          </div>
        </Card>
      </div>
    </main>
  );
}
