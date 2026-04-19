import { CarrierScaffoldPage } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripNewSchedulePage() {
  return (
    <CarrierScaffoldPage
      eyebrow="New trip · Step 2"
      title="Schedule"
      description="Set date, time window, and optional regular-run cadence."
      actions={[{ href: "/carrier/trips/new/vehicle-capacity", label: "Continue to vehicle and capacity", tone: "primary", operational: true }]}
    />
  );
}
