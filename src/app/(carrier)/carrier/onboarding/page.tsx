import { requirePageSessionUser } from "@/lib/auth";
import { CarrierOnboardingForm } from "@/components/carrier/carrier-onboarding-form";
import { PageIntro } from "@/components/layout/page-intro";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { Card } from "@/components/ui/card";
import { saveCarrierOnboarding } from "./actions";

const steps = [
  "Business profile and contact details",
  "Vehicle registration and capacity",
  "Licence and insurance upload",
  "Manual admin approval before search visibility",
];

export default async function CarrierOnboardingPage() {
  const user = await requirePageSessionUser();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier onboarding"
        title="Verify supply before it hits the marketplace"
        description="Manual-first verification is part of the trust layer and keeps the early marketplace high quality."
      />

      <TripChecklist />

      <Card className="p-4">
        <div className="space-y-3">
          <p className="section-label">Steps</p>
          <div className="grid gap-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-xl border border-border px-3 py-2">
                <span className="text-sm text-text">
                  {index + 1}. {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <CarrierOnboardingForm action={saveCarrierOnboarding} defaultEmail={user.email ?? ""} />
      </Card>
    </main>
  );
}
