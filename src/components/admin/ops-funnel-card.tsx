import { Card } from "@/components/ui/card";
import type { ValidationMetric } from "@/types/admin";

function findMetric(metrics: ValidationMetric[], label: string) {
  return metrics.find((metric) => metric.label === label);
}

function formatMetric(metric?: ValidationMetric) {
  if (!metric) {
    return "0";
  }

  if (metric.kind === "percentage") {
    return `${metric.value}%`;
  }

  if (metric.kind === "currency") {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(metric.value / 100);
  }

  return metric.value.toLocaleString("en-AU");
}

function FunnelStep({
  label,
  metric,
  helper,
}: {
  label: string;
  metric?: ValidationMetric;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl text-text">{formatMetric(metric)}</p>
      <p className="mt-2 text-sm text-text-secondary">{helper}</p>
    </div>
  );
}

export function OpsFunnelCard({ metrics }: { metrics: ValidationMetric[] }) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <p className="section-label">Ops funnel</p>
          <h2 className="mt-1 text-lg text-text">Current demand-to-completion snapshot</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Weekly 7-day rollups still need backend timestamp support, so this uses the current
            aggregate metrics feed and keeps the gap visible.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FunnelStep
            label="Active listings"
            metric={findMetric(metrics, "Active listings")}
            helper="Current supply visible in the marketplace."
          />
          <FunnelStep
            label="Search conversion"
            metric={findMetric(metrics, "Search-to-booking conversion")}
            helper="Booking starts divided by search submissions."
          />
          <FunnelStep
            label="Completed jobs"
            metric={findMetric(metrics, "Completed bookings")}
            helper="Completed bookings in the current snapshot."
          />
          <FunnelStep
            label="Open disputes"
            metric={findMetric(metrics, "Open disputes")}
            helper="Lower is better for trust and ops load."
          />
        </div>

        <div className="grid gap-2 text-sm text-text-secondary sm:grid-cols-3">
          <p>Fill rate target: {formatMetric(findMetric(metrics, "Fill rate target"))}</p>
          <p>Carrier reuse: {formatMetric(findMetric(metrics, "Carrier reuse"))}</p>
          <p>Avg job value: {formatMetric(findMetric(metrics, "Avg job value"))}</p>
        </div>
      </div>
    </Card>
  );
}
