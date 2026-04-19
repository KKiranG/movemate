import { CarrierScaffoldPage, KeyValueList, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierAccountVerificationPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Account · Verification"
      title="Verification status"
      description="Activation and trust states shown in one place for recovery actions."
      actions={[{ href: "/carrier/account", label: "Back to account" }, { href: "/carrier/activate", label: "Resume activation", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Current status">
        <KeyValueList
          items={[
            { label: "Identity", value: "Pending" },
            { label: "Vehicle", value: "Pending" },
            { label: "Payout", value: "Pending" },
          ]}
        />
      </ScaffoldCard>
    </CarrierScaffoldPage>
  );
}
