import { CarrierScaffoldPage } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripNewRoutePage() {
  return (
    <CarrierScaffoldPage
      eyebrow="New trip · Step 1"
      title="Route"
      description="Start and end are required, with optional waypoints for repeat corridors."
      actions={[{ href: "/carrier/trips/new/schedule", label: "Continue to schedule", tone: "primary", operational: true }]}
    />
  );
}
