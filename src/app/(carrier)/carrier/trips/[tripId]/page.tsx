import { CarrierScaffoldPage, KeyValueList, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierTripDetailShellPage({ params }: { params: { tripId: string } }) {
  return (
    <CarrierScaffoldPage
      eyebrow="Trip detail"
      title={`Trip ${params.tripId}`}
      description="Trip detail keeps operations, request handling, and proof requirements in one place."
      actions={[
        { href: `/carrier/trips/${params.tripId}/runsheet`, label: "Open runsheet", tone: "primary", operational: true },
        { href: "/carrier/requests", label: "Open requests", operational: true },
        { href: "/carrier/trips", label: "Back to trips" },
      ]}
    >
      <ScaffoldCard title="Trip-state buckets">
        <KeyValueList
          items={[
            { label: "Needs action", value: "Pending request or proof blocker" },
            { label: "Today", value: "Runsheet actions and one-tap statuses" },
            { label: "Upcoming", value: "Confirmed bookings and trip freshness" },
          ]}
        />
      </ScaffoldCard>
    </CarrierScaffoldPage>
  );
}
