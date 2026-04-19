import { CarrierScaffoldPage, KeyValueList, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierActivatePage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Activation"
      title="Complete setup to unlock jobs"
      description="Activation is required before posting supply or accepting booking requests."
      actions={[
        { href: "/carrier/activate/identity", label: "Start identity", tone: "primary", operational: true },
        { href: "/carrier/activate/vehicle", label: "Vehicle and capacity", operational: true },
        { href: "/carrier/activate/payout", label: "Payout and documents", operational: true },
        { href: "/carrier/activate/submitted", label: "Review submitted" },
      ]}
    >
      <ScaffoldCard title="Activation steps">
        <KeyValueList
          items={[
            { label: "Step 1", value: "Identity and business" },
            { label: "Step 2", value: "Vehicle and capacity" },
            { label: "Step 3", value: "Payout and documents" },
          ]}
        />
      </ScaffoldCard>
    </CarrierScaffoldPage>
  );
}
