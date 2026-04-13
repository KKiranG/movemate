import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierActivationLabel } from "@/lib/carrier-activation";
import { getCarrierByUserId } from "@/lib/data/carriers";

export const metadata: Metadata = {
  title: "Carrier account",
  description: "View carrier account status, verification, and the main operational shortcuts.",
};

export default async function CarrierAccountPage() {
  const user = await requirePageSessionUser();
  const carrier = await getCarrierByUserId(user.id);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Account"
        title="Carrier account"
        description="Use this space for carrier identity, verification, and operational shortcuts while the deeper account settings flow is still being realigned."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-4">
          <p className="section-label">Carrier profile</p>
          <h2 className="mt-1 text-lg text-text">{carrier?.businessName ?? user.email ?? "Carrier account"}</h2>
          <div className="mt-3 grid gap-2 text-sm text-text-secondary">
            <p>Email: {user.email ?? "Not available"}</p>
            <p>Activation: {carrier ? getCarrierActivationLabel(carrier.activationStatus) : "Not started"}</p>
            <p>Payout setup: {carrier?.stripeOnboardingComplete ? "Ready" : "Still required"}</p>
            <p>ABN trust booster: {carrier?.abnVerified ? "Verified" : carrier?.abn ? "Provided" : "Not added"}</p>
          </div>
        </Card>

        <Card className="p-4">
          <p className="section-label">Quick links</p>
          <div className="mt-3 grid gap-2">
            <Link
              href="/carrier/requests"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-3 text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            >
              Open requests
            </Link>
            <Link
              href="/carrier/trips"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-3 text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            >
              Open trips
            </Link>
            <Link
              href="/carrier/payouts"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-3 text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            >
              Open payouts
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
