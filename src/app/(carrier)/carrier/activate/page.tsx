import type { Metadata } from "next";
import Link from "next/link";

import { CarrierOnboardingForm } from "@/components/carrier/carrier-onboarding-form";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import {
  getCarrierActivationBlockers,
  getCarrierActivationLabel,
  isCarrierActivationLive,
} from "@/lib/carrier-activation";
import { getCarrierByUserId } from "@/lib/data/carriers";

import { saveCarrierOnboarding } from "../onboarding/actions";

export const metadata: Metadata = {
  title: "Carrier activation",
  description: "Finish carrier onboarding, document upload, and activation review in one place.",
};

export default async function CarrierActivatePage() {
  const user = await requirePageSessionUser();
  const carrier = await getCarrierByUserId(user.id);
  const activationLive = carrier ? isCarrierActivationLive(carrier.activationStatus) : false;
  const blockers = getCarrierActivationBlockers(carrier);

  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="Activation"
        title={activationLive ? "Your carrier profile is live" : "Finish setup to unlock live work"}
        description={
          activationLive
            ? "Keep documents, payout readiness, and vehicle details current so supply never slips out of the live marketplace."
            : "This is the real carrier activation flow. Add business details, vehicle capacity, and required documents here, then MoveMate can move you into review."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/carrier">Back to carrier home</Link>
            </Button>
            <Button asChild>
              <Link href={activationLive ? "/carrier/trips/new" : "/carrier/payouts"}>
                {activationLive ? "Post a trip" : "Open payouts"}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card className={`p-4 ${activationLive ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/10"}`}>
            <p className="section-label">Current state</p>
            <h2 className="mt-1 text-lg text-text">
              {carrier ? getCarrierActivationLabel(carrier.activationStatus) : "Not started"}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {activationLive
                ? "You can post live supply and keep editing the onboarding record here whenever docs or vehicle details change."
                : blockers[0] ??
                  "Carrier activation has not started yet. Complete the pack below to move into review."}
            </p>
            {carrier?.verificationNotes ? (
              <p className="mt-3 rounded-xl border border-border bg-black/[0.02] px-3 py-2 text-sm text-text-secondary dark:bg-white/[0.04]">
                Ops note: {carrier.verificationNotes}
              </p>
            ) : null}
          </Card>

          <CarrierOnboardingForm
            action={saveCarrierOnboarding}
            defaultEmail={user.email ?? ""}
            existingCarrier={carrier}
            draftStorageKey={user.id}
          />
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Activation checklist</p>
                <h2 className="mt-1 text-lg text-text">What MoveMate still needs from supply</h2>
              </div>
              <div className="grid gap-3">
                {blockers.map((blocker) => (
                  <div key={blocker} className="rounded-xl border border-border p-3 text-sm text-text-secondary">
                    {blocker}
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Payout setup</p>
                  <p className="mt-2 text-sm text-text">
                    {carrier?.stripeOnboardingComplete ? "Ready for release" : "Still required"}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Business record</p>
                  <p className="mt-2 text-sm text-text">
                    {carrier?.businessName ? carrier.businessName : "Business details still missing"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <TripChecklist carrier={carrier} />
        </div>
      </div>
    </main>
  );
}
