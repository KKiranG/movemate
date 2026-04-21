import Link from "next/link";
import { ArrowRight, Box, Refrigerator, Sofa, Truck } from "lucide-react";

import { AmbientMap } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";

const presets = [
  {
    label: "A sofa or armchair",
    detail: "From around $65 in metro",
    icon: Sofa,
  },
  {
    label: "A fridge or appliance",
    detail: "From around $85 all-in",
    icon: Refrigerator,
  },
  {
    label: "A marketplace pickup",
    detail: "Seller to your place",
    icon: Box,
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="pb-10">
      <div className="relative">
        <AmbientMap />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[calc(14px+var(--safe-area-top))]">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-[44px] flex-col justify-center rounded-[var(--radius-pill)] px-1 text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-subtle)]"
          >
            <span className="text-[18px] font-semibold tracking-[-0.04em]">MoveMate</span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Need-first spare-capacity moves
            </span>
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.72)] px-4 text-[13px] font-medium text-[var(--text-primary)] backdrop-blur-[12px] hover:bg-white active:bg-[var(--bg-elevated-2)]"
          >
            Log in
          </Link>
        </div>
      </div>

      <section className="screen screen-wide -mt-9 space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">MoveMate | Need-first, trust-first</p>
          <h1 className="display-title max-w-[8ch]">What needs to move?</h1>
          <p className="body max-w-[30ch] text-[var(--text-secondary)]">
            MoveMate starts with the move need, then shows ranked spare-capacity
            matches with clear pricing, fit notes, and trust signals.
          </p>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-4 shadow-[var(--shadow-card)]">
          <div className="space-y-1 rounded-[var(--radius-lg)] bg-[var(--bg-elevated-2)] p-2">
            <label className="flex min-h-[58px] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] px-4">
              <span className="h-3 w-3 rounded-full border-2 border-[var(--text-primary)]" />
              <span className="text-[15px] text-[var(--text-tertiary)]">From — suburb or address</span>
            </label>
            <label className="flex min-h-[58px] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--bg-base)] px-4">
              <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
              <span className="text-[15px] text-[var(--text-tertiary)]">To</span>
            </label>
          </div>

          <Button asChild className="mt-4 w-full">
            <Link href="/move/new/route">
              Tell MoveMate your move
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-center text-[12px] text-[var(--text-tertiary)]">
            Start with the need first. See ranked, trust-backed matches instead of
            browsing raw driver listings.
          </p>
        </div>

        <div>
          <p className="eyebrow">Popular move needs</p>
          <div className="mt-3 space-y-3">
            {presets.map((preset) => {
              const Icon = preset.icon;

              return (
                <Link
                  key={preset.label}
                  href="/move/new/route"
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-4 py-4 shadow-[var(--shadow-card)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">{preset.label}</p>
                    <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{preset.detail}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="surface-1 space-y-3">
          <p className="eyebrow">How it works</p>
          <div className="grid gap-3">
            <div>
              <p className="title">Declare the move need</p>
              <p className="caption">Route, item, timing, and access first.</p>
            </div>
            <div>
              <p className="title">See ranked matches</p>
              <p className="caption">
                Every match explains fit, price clarity, and trust before you book.
              </p>
            </div>
            <div>
              <p className="title">Book and track cleanly</p>
              <p className="caption">
                Structured updates, proof on delivery, and payout only after
                confirmation.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/carrier"
          className="flex min-h-[54px] items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-4 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-1)] active:bg-[var(--bg-elevated-2)]"
        >
          <Truck className="h-4 w-4" />
          Have spare space on a real route? Drive with MoveMate
        </Link>
      </section>
    </main>
  );
}
