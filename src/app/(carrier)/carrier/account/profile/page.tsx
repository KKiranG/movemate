import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierAccountProfilePage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Account · Profile"
      title="Profile"
      description="Carrier identity and contact data used across operational surfaces."
      actions={[{ href: "/carrier/account", label: "Back to account" }, { href: "/carrier/account", label: "Save profile", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Fields" description="Name, phone, business details, and optional ABN." />
    </CarrierScaffoldPage>
  );
}
