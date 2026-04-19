import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierActivateSubmittedPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Activation submitted"
      title="Review in progress"
      description="Verification is manual at MVP. You can still view shell pages while waiting for approval."
      actions={[
        { href: "/carrier", label: "Back to home", tone: "primary", operational: true },
        { href: "/carrier/activate", label: "Edit activation" },
      ]}
    >
      <ScaffoldCard title="Expected turnaround" description="Target review turnaround is 24 hours with explicit approve/reject notes." />
    </CarrierScaffoldPage>
  );
}
