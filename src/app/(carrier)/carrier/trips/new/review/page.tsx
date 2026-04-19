import { CarrierScaffoldPage } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripNewReviewPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="New trip · Step 5"
      title="Review and publish"
      description="Final check before making this route visible to matching."
      actions={[
        { href: "/carrier/trips?posted=1", label: "Publish trip", tone: "primary", operational: true },
        { href: "/carrier/trips", label: "Save as draft", operational: true },
      ]}
    />
  );
}
