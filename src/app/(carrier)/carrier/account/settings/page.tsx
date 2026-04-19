import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierAccountSettingsPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Account · Settings"
      title="Settings"
      description="Control notification timing and operational preferences for routes and requests."
      actions={[{ href: "/carrier/account", label: "Back to account" }, { href: "/carrier/account", label: "Save settings", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Preferences" description="Request alerts, trip check-ins, and payout notifications." />
    </CarrierScaffoldPage>
  );
}
