import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierAccountVehiclePage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Account · Vehicle"
      title="Vehicle"
      description="Vehicle settings used for activation trust checks and listing quality."
      actions={[{ href: "/carrier/account", label: "Back to account" }, { href: "/carrier/account", label: "Save vehicle", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Fields" description="Vehicle type, registration, photos, and capacity defaults." />
    </CarrierScaffoldPage>
  );
}
