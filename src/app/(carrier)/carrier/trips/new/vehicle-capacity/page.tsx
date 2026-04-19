import { CarrierScaffoldPage } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripNewVehicleCapacityPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="New trip · Step 3"
      title="Vehicle and capacity"
      description="Define accepted categories and hard constraints before pricing."
      actions={[{ href: "/carrier/trips/new/pricing", label: "Continue to pricing", tone: "primary", operational: true }]}
    />
  );
}
