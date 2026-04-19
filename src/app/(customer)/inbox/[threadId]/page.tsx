import Link from "next/link";

import { TopAppBar } from "@/components/spec/chrome";

const quickReplies = ["I'm running late", "Where should I park?", "Can you call when you arrive?"];

export default function InboxThreadPage({ params }: { params: { threadId: string } }) {
  return (
    <main className="pb-24">
      <TopAppBar title="Thread" backHref="/inbox" />
      <section className="screen space-y-3">
        <Link
          href="/bookings/demo-booking"
          className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-sm)] bg-[var(--bg-elevated-1)] px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
        >
          View booking
        </Link>
        <div className="surface-1">
          <p className="caption">Carrier: On the way now. ETA 20 min.</p>
        </div>
        <div className="surface-2">
          <p className="caption">Customer: Great, thanks.</p>
        </div>
      </section>
      <div className="sticky-cta space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((chip) => (
            <button
              key={chip}
              type="button"
              className="min-h-[44px] min-w-[44px] shrink-0 rounded-[var(--radius-pill)] bg-[var(--bg-elevated-2)] px-3 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-3)] active:bg-[var(--bg-elevated-3)]"
            >
              {chip}
            </button>
          ))}
        </div>
        <input className="ios-input" placeholder={`Reply in ${params.threadId}`} />
      </div>
    </main>
  );
}
