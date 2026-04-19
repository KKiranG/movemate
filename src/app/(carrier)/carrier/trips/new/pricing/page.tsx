import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripNewPricingPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="New trip · Step 4"
      title="Detour and pricing"
      description="Commission applies to base only; stairs and helper are separate add-ons."
      actions={[{ href: "/carrier/trips/new/review", label: "Continue to review", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Pricing invariant" description="Commission = 15% of basePriceCents only." />
    </CarrierScaffoldPage>
  );
}
