import Link from "next/link";

import { TopAppBar } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";

export default function AlertNetworkPage() {
  return (
    <main>
      <TopAppBar title="Alert the Network" backHref="/move/new/results" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Zero-match recovery</p>
          <h1 className="heading">No drivers going that way — yet.</h1>
          <p className="body text-[var(--text-secondary)]">
            We’ll alert verified drivers on similar corridors and tell you the moment someone posts your route.
          </p>
        </div>

        <div className="surface-1 space-y-3">
          <p className="title">What happens next</p>
          <p className="caption">1. We alert drivers now.</p>
          <p className="caption">2. You get push and email updates.</p>
          <p className="caption">3. If the route stays quiet, the team can step in manually.</p>
        </div>

        <div className="surface-1">
          <p className="caption">Sofa · Newtown → Burwood · this week</p>
          <Link
            href="/move/new/route"
            className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Edit this move
          </Link>
        </div>

        <label className="flex min-h-[54px] min-w-[44px] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-4">
          <input type="checkbox" className="h-4 w-4" />
          <span className="caption">Also broaden my dates by ±3 days</span>
        </label>
        <label className="flex min-h-[54px] min-w-[44px] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-4">
          <input type="checkbox" defaultChecked className="h-4 w-4" />
          <span className="caption">Notify me via email too</span>
        </label>

        <Button asChild className="w-full">
          <Link href="/activity">Alert the Network</Link>
        </Button>
      </section>
    </main>
  );
}
