import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierActivatePayoutPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Activation step 3"
      title="Payout and documents"
      description="Stripe payout setup is required before completed jobs can release funds."
      actions={[{ href: "/carrier/activate/submitted", label: "Submit activation", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Required fields" description="Connect onboarding and optional insurance upload." />
    </CarrierScaffoldPage>
  );
}
