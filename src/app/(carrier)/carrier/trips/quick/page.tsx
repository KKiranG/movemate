import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripQuickPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Quick post"
      title="Repost a proven route"
      description="Quick post keeps repeat supply under 30 seconds for returning carriers."
      actions={[
        { href: "/carrier/trips/new/review", label: "Use selected template", tone: "primary", operational: true },
        { href: "/carrier/trips/new/route", label: "Switch to advanced post", operational: true },
      ]}
    >
      <ScaffoldCard title="Template slots" description="Recent routes appear here with one-tap date and pricing confirmation." />
    </CarrierScaffoldPage>
  );
}
