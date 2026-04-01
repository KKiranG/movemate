import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CarrierProfile } from "@/types/carrier";

const items = [
  "Post route, date, space, and price in under 60 seconds.",
  "Keep detour tolerance honest so matches stay trustworthy.",
  "Upload licence and insurance once for manual verification.",
  "Use pickup and delivery photos as proof before payout release.",
];

function getExpiryState(value?: string | null) {
  if (!value) {
    return null;
  }

  const expiryDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(expiryDate.getTime())) {
    return null;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    return { tone: "critical" as const, label: "Expired", diffDays };
  }

  if (diffDays <= 30) {
    return { tone: "warning" as const, label: "Expiring soon", diffDays };
  }

  return { tone: "healthy" as const, label: "Healthy", diffDays };
}

export function TripChecklist({ carrier }: { carrier?: CarrierProfile | null } = {}) {
  const licenceState = getExpiryState(carrier?.licenceExpiryDate);
  const insuranceState = getExpiryState(carrier?.insuranceExpiryDate);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <p className="section-label">Carrier principles</p>
        <h2 className="text-lg text-text">What the MVP needs from supply</h2>
        {carrier ? (
          <div className="rounded-xl border border-border bg-black/[0.02] p-3">
            <p className="text-sm font-medium text-text">Document health</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {([["Licence", licenceState], ["Insurance", insuranceState]] as const).map(
                ([label, state]) => (
                  <div
                    key={label}
                    className={`rounded-xl border p-3 text-sm ${
                      state?.tone === "critical"
                        ? "border-error/20 bg-error/10 text-error"
                        : state?.tone === "warning"
                          ? "border-warning/20 bg-warning/10 text-warning"
                          : "border-success/20 bg-success/5 text-success"
                    }`}
                  >
                    <p className="font-medium">{label}</p>
                    <p className="mt-1">
                      {state
                        ? `${state.label}${state.diffDays >= 0 ? ` · ${state.diffDays} day${state.diffDays === 1 ? "" : "s"} left` : ""}`
                        : "Add an expiry date"}
                    </p>
                  </div>
                ),
              )}
            </div>
            {licenceState?.tone === "critical" || insuranceState?.tone === "critical" ? (
              <div className="mt-3 rounded-xl border border-error/20 bg-error/10 p-3">
                <p className="text-sm font-medium text-error">Action needed</p>
                <p className="mt-1 text-sm text-text-secondary">
                  One or more documents are expired. Update them before posting new trips or accepting more work.
                </p>
                <Button asChild variant="secondary" className="mt-3">
                  <Link href="/carrier/onboarding">Update documents</Link>
                </Button>
              </div>
            ) : licenceState?.tone === "warning" || insuranceState?.tone === "warning" ? (
              <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 p-3">
                <p className="text-sm font-medium text-warning">Coming due soon</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Keep licence and insurance current so verification never blocks a rush booking.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">
                Your document dates look healthy. Keep them current so trips stay live.
              </p>
            )}
          </div>
        ) : null}
        <ul className="space-y-2 text-sm leading-6 text-text-secondary">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
