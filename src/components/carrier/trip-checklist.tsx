import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MANUAL_HANDLING_POLICY_LINES,
  PROHIBITED_ITEM_POLICY_LINES,
} from "@/lib/constants";
import type { CarrierProfile } from "@/types/carrier";

const items = [
  "Post route, date, space, and price in under 60 seconds.",
  "Keep detour tolerance honest so matches stay trustworthy.",
  "Respond to booking updates within 24 hours. Pending requests still expire in 2 hours.",
  "Keep all extras and payment changes on MoveMate. Do not switch to cash or bank transfer.",
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
  const diffDays = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays < 0) {
    return { tone: "critical" as const, label: "Expired", diffDays };
  }

  if (diffDays <= 30) {
    return { tone: "warning" as const, label: "Expiring soon", diffDays };
  }

  return { tone: "healthy" as const, label: "Healthy", diffDays };
}

export function TripChecklist({
  carrier,
}: { carrier?: CarrierProfile | null } = {}) {
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
              {(
                [
                  ["Licence", licenceState],
                  ["Insurance", insuranceState],
                ] as const
              ).map(([label, state]) => (
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
              ))}
            </div>
            {licenceState?.tone === "critical" ||
            insuranceState?.tone === "critical" ? (
              <div className="mt-3 rounded-xl border border-error/20 bg-error/10 p-3">
                <p className="text-sm font-medium text-error">Action needed</p>
                <p className="mt-1 text-sm text-text-secondary">
                  One or more documents are expired. Update them before posting
                  new trips or accepting more work.
                </p>
                <Button asChild variant="secondary" className="mt-3">
                  <Link href="/carrier/onboarding">Update documents</Link>
                </Button>
              </div>
            ) : licenceState?.tone === "warning" ||
              insuranceState?.tone === "warning" ? (
              <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 p-3">
                <p className="text-sm font-medium text-warning">
                  Coming due soon
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Keep licence and insurance current so verification never
                  blocks a rush booking.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">
                Your document dates look healthy. Keep them current so trips
                stay live.
              </p>
            )}
          </div>
        ) : null}
        <ul className="space-y-2 text-sm leading-6 text-text-secondary">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
          <p className="text-sm font-medium text-text">
            Unsafe loads stay out of scope
          </p>
          <div className="mt-2 space-y-2 text-sm text-text-secondary">
            {PROHIBITED_ITEM_POLICY_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
          <p className="text-sm font-medium text-text">
            Manual-handling reminders
          </p>
          <div className="mt-2 space-y-2 text-sm text-text-secondary">
            {MANUAL_HANDLING_POLICY_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
