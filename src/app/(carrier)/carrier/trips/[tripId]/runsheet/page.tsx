import { CarrierScaffoldPage, KeyValueList, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";
import Link from "next/link";

export default function CarrierTripRunsheetPage({ params }: { params: { tripId: string } }) {
  return (
    <CarrierScaffoldPage
      eyebrow="Runsheet"
      title={`Trip ${params.tripId} · Today`}
      description="Runsheet mode prioritizes large operational actions for in-vehicle use."
      actions={[
        { href: `/carrier/trips/${params.tripId}`, label: "Back to trip" },
        { href: "/carrier/payouts", label: "Proof complete", tone: "primary", operational: true },
      ]}
    >
      <ScaffoldCard title="Stop action sequence">
        <KeyValueList
          items={[
            { label: "1", value: "On my way" },
            { label: "2", value: "Arrived" },
            { label: "3", value: "Item loaded" },
            { label: "4", value: "Delivered + upload proof" },
          ]}
        />
      </ScaffoldCard>
      <ScaffoldCard title="One-tap status updates" description="Operational actions use 52px controls for in-vehicle use.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={`/carrier/trips/${params.tripId}/runsheet`}
            className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            On my way
          </Link>
          <Link
            href={`/carrier/trips/${params.tripId}/runsheet`}
            className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Arrived
          </Link>
          <Link
            href={`/carrier/trips/${params.tripId}/runsheet`}
            className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Item loaded
          </Link>
          <Link
            href={`/carrier/trips/${params.tripId}/runsheet`}
            className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-[var(--accent)] px-4 text-[15px] font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]"
          >
            Delivered
          </Link>
        </div>
      </ScaffoldCard>
      <ScaffoldCard title="Proof capture" description="Camera-first delivery proof with iOS-compatible formats.">
        <label
          htmlFor="proof-upload"
          className="touch-52 inline-flex min-w-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
        >
          Upload delivery proof
        </label>
        <input
          id="proof-upload"
          type="file"
          accept="image/*,image/heic,image/heif"
          capture="environment"
          className="min-h-[44px] min-w-[44px] caption file:mr-3 file:min-h-[44px] file:min-w-[44px] file:rounded-[var(--radius-sm)] file:border file:border-[var(--border-subtle)] file:bg-[var(--bg-elevated-1)] file:px-3 file:text-[13px] file:text-[var(--text-primary)] hover:file:bg-[var(--bg-elevated-2)] active:file:bg-[var(--bg-elevated-3)]"
        />
      </ScaffoldCard>
    </CarrierScaffoldPage>
  );
}
