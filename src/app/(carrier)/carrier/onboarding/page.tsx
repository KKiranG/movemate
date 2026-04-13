import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierActivationLabel } from "@/lib/carrier-activation";
import { CarrierOnboardingForm } from "@/components/carrier/carrier-onboarding-form";
import type { Metadata } from "next";

import { ConnectPayoutButton } from "@/components/carrier/connect-payout-button";
import { PageIntro } from "@/components/layout/page-intro";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { Card } from "@/components/ui/card";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { saveCarrierOnboarding } from "./actions";

export const metadata: Metadata = {
  title: "Carrier onboarding",
};

const steps = [
  {
    label: "Business profile and contact details",
    isComplete: (carrier: NonNullable<Awaited<ReturnType<typeof getCarrierByUserId>>>) =>
      Boolean(carrier.businessName && carrier.contactName && carrier.phone && carrier.email),
  },
  {
    label: "Vehicle registration and capacity",
    isComplete: (carrier: NonNullable<Awaited<ReturnType<typeof getCarrierByUserId>>>) =>
      Boolean(carrier.vehiclePhotoUrl),
  },
  {
    label: "Licence and insurance upload",
    isComplete: (carrier: NonNullable<Awaited<ReturnType<typeof getCarrierByUserId>>>) =>
      Boolean(carrier.licencePhotoUrl && carrier.insurancePhotoUrl),
  },
  {
    label: "Activation approval before live marketplace visibility",
    isComplete: (carrier: NonNullable<Awaited<ReturnType<typeof getCarrierByUserId>>>) =>
      carrier.activationStatus === "active",
  },
] as const;

export default async function CarrierOnboardingPage() {
  const user = await requirePageSessionUser();
  const existingCarrier = await getCarrierByUserId(user.id);
  const onboardingSteps = steps.map((step) => ({
    label: step.label,
    complete: existingCarrier ? step.isComplete(existingCarrier) : false,
  }));

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier onboarding"
        title="Verify supply before it hits the marketplace"
        description="Manual-first verification is part of the trust layer and keeps the early marketplace high quality."
      />

      <TripChecklist carrier={existingCarrier} />

      <Card className="p-4">
        <div className="space-y-3">
          <p className="section-label">Steps</p>
          <div className="grid gap-2">
            {onboardingSteps.map((step, index) => (
            <div
              key={step.label}
                className={`rounded-xl border px-3 py-2 ${
                  step.complete ? "border-success/30 bg-success/10" : "border-border"
                }`}
              >
                <span className="text-sm text-text">
                  {step.complete ? "✓" : index + 1}. {step.label}
                </span>
              </div>
            ))}
          </div>
          {existingCarrier ? (
            <p className="text-sm text-text-secondary">
              Current activation state: {getCarrierActivationLabel(existingCarrier.activationStatus)}
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        {existingCarrier && !existingCarrier.stripeOnboardingComplete ? (
          <div className="mb-4 rounded-xl border border-warning/20 bg-warning/10 p-4">
            <p className="section-label">Payout setup</p>
            <h2 className="mt-1 text-lg text-text">Stripe Connect still needs to be completed</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Manual verification helps supply quality, but completed jobs still cannot be released
              until payout onboarding is finished in Stripe.
            </p>
            <div className="mt-3">
              <ConnectPayoutButton variant="secondary" label="Start payout setup" />
            </div>
          </div>
        ) : null}
        <CarrierOnboardingForm
          action={saveCarrierOnboarding}
          defaultEmail={user.email ?? ""}
          existingCarrier={existingCarrier}
          draftStorageKey={user.id}
        />
      </Card>
    </main>
  );
}
