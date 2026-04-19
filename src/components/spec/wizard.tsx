import Link from "next/link";

import { Button } from "@/components/ui/button";

export function WizardHeader({
  step,
  backHref,
  closeHref = "/",
}: {
  step: 1 | 2 | 3 | 4;
  backHref: string;
  closeHref?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[color:rgba(247,246,242,0.88)] px-5 pb-3 pt-[calc(var(--safe-area-top)+10px)] backdrop-blur-[18px]">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1" aria-label={`Step ${step} of 4`}>
          <div className="mb-2 flex items-center justify-center gap-2">
            <p className="eyebrow">Step {step} of 4</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((item) => (
              <span
              key={item}
              className={`h-1.5 rounded-full ${item <= step ? "bg-[var(--accent)]" : "bg-[var(--bg-elevated-3)]"}`}
              />
            ))}
          </div>
        </div>
        <Link
          href={closeHref}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          aria-label="Close"
        >
          ✕
        </Link>
      </div>
    </header>
  );
}

export function StickyCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="sticky-cta">
      <Button asChild className="w-full">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
