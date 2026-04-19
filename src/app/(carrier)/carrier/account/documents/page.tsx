import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierAccountDocumentsPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Account · Documents"
      title="Documents"
      description="Store trust-critical files needed for activation and payout review."
      actions={[{ href: "/carrier/account", label: "Back to account" }, { href: "/carrier/account", label: "Upload documents", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Files" description="Licence, insurance, and supporting compliance documents." />
    </CarrierScaffoldPage>
  );
}
