import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripNewIndexPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="New trip"
      title="Trip posting wizard"
      description="Advanced post flow with explicit steps and operationally-safe actions."
      actions={[
        { href: "/carrier/trips/new/route", label: "Start route step", tone: "primary", operational: true },
        { href: "/carrier/trips/quick", label: "Use quick post", operational: true },
      ]}
    >
      <ScaffoldCard title="Wizard steps" description="Route, schedule, vehicle-capacity, pricing, review-publish." />
    </CarrierScaffoldPage>
  );
}
