import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierActivateIdentityPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Activation step 1"
      title="Identity and business"
      description="Collect legal identity and licence evidence before operational access."
      actions={[{ href: "/carrier/activate/vehicle", label: "Save and continue", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Required fields" description="Legal name, licence upload, optional ABN." />
    </CarrierScaffoldPage>
  );
}
