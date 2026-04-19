import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierActivateVehiclePage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Activation step 2"
      title="Vehicle and capacity"
      description="Define constraints early so matching remains deterministic and trustworthy."
      actions={[{ href: "/carrier/activate/payout", label: "Save and continue", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Required fields" description="Vehicle type, rego, photo, capacity descriptor, item constraints." />
    </CarrierScaffoldPage>
  );
}
