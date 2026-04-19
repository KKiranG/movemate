import Link from "next/link";

export default function CarrierTodayLegacyRoute() {
  return (
    <main id="main-content" className="screen safe-bottom-pad app-scroll space-y-4">
      <header className="space-y-2">
        <p className="eyebrow">Legacy route</p>
        <h1 className="heading">Today moved into trip runsheets</h1>
        <p className="caption">
          Runsheet operations now live on <code>/carrier/trips/[tripId]/runsheet</code>. Open a trip to continue.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/carrier/trips"
          className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
        >
          Open trips
        </Link>
        <Link
          href="/carrier"
          className="touch-52 inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-[var(--accent)] px-4 text-[15px] font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]"
        >
          Go to carrier home
        </Link>
      </div>
    </main>
  );
}
