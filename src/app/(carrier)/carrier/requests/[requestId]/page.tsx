import { CarrierScaffoldPage, KeyValueList, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";
import Link from "next/link";

export default function CarrierRequestDetailPage({ params }: { params: { requestId: string } }) {
  return (
    <CarrierScaffoldPage
      eyebrow="Request detail"
      title={`Request ${params.requestId}`}
      description="Decision cards keep fit, access, payout, and response deadline visible first."
      actions={[
        { href: "/carrier/requests", label: "Back to requests" },
        { href: "/carrier/requests", label: "Accept request", tone: "primary", operational: true },
        { href: "/carrier/requests", label: "Decline request", operational: true },
      ]}
    >
      <ScaffoldCard title="Decision card fields">
        <KeyValueList
          items={[
            { label: "Route fit", value: "Pickup detour and drop-off fit" },
            { label: "Access", value: "Stairs, lift, helper complexity" },
            { label: "Payout", value: "Net carrier payout after base commission" },
            { label: "Deadline", value: "Response window for this request" },
          ]}
        />
      </ScaffoldCard>
      <ScaffoldCard title="Decision actions" description="High-clarity operational controls for mobile handling.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/carrier/requests"
            className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-[var(--accent)] px-4 text-[15px] font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]"
          >
            Accept and confirm
          </Link>
          <Link
            href="/carrier/requests"
            className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Decline request
          </Link>
        </div>
      </ScaffoldCard>
    </CarrierScaffoldPage>
  );
}
