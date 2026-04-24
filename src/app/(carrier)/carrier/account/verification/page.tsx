import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import type { CarrierActivationStatus } from "@/types/carrier";

export const metadata: Metadata = {
  title: "Verification status",
  description: "Activation and trust states for your carrier account.",
};

function activationLabel(status: CarrierActivationStatus | null | undefined): string {
  switch (status) {
    case "active":
      return "Verified";
    case "pending_review":
      return "Under review";
    case "rejected":
      return "Requires attention";
    default:
      return "—";
  }
}

export default async function CarrierAccountVerificationPage() {
  const user = await requirePageSessionUser();
  const carrier = await getCarrierByUserId(user.id);

  const identityLabel = activationLabel(carrier?.activationStatus);
  const vehicleLabel = activationLabel(carrier?.activationStatus);
  const payoutLabel = carrier?.stripeOnboardingComplete ? "Connected" : "—";

  const items = [
    { label: "Identity", value: identityLabel },
    { label: "Vehicle", value: vehicleLabel },
    { label: "Payout", value: payoutLabel },
  ];

  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="Account · Verification"
        title="Verification status"
        description="Activation and trust states for your carrier account."
      />

      <div className="grid gap-4">
        <Card className="p-4">
          <p className="eyebrow mb-3">Current status</p>
          <dl className="grid gap-3">
            {items.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
                <dd className="text-sm font-medium text-[var(--text-primary)]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="flex gap-3">
          <Link
            href="/carrier/account"
            className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Back to account
          </Link>
          <Link
            href="/carrier/activate"
            className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-md)] bg-[var(--brand-ink)] px-4 py-3 text-sm font-medium text-[var(--brand-paper)] hover:opacity-90 active:opacity-80"
          >
            Resume activation
          </Link>
        </div>
      </div>
    </main>
  );
}
