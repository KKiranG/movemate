import Link from "next/link";
import { ArrowRight, BedDouble, Box, Refrigerator, Sofa, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";

const presets = [
  {
    label: "A sofa or armchair",
    detail: "From around $65 in metro",
    icon: Sofa,
    href: "/move/new?category=furniture",
  },
  {
    label: "A fridge or large appliance",
    detail: "From around $85",
    icon: Refrigerator,
    href: "/move/new?category=appliance",
  },
  {
    label: "A marketplace pickup",
    detail: "Seller → your place",
    icon: Box,
    href: "/move/new?category=boxes",
  },
  {
    label: "A bed or bed frame",
    detail: "Any size, pickup included",
    icon: BedDouble,
    href: "/move/new?category=furniture",
  },
];

export default function HomePage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[calc(14px+var(--safe-area-top))]">
        <Wordmark />
        <Link
          href="/auth/login"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-elevated-2)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-3)] active:opacity-70"
          aria-label="Account"
        >
          <User size={18} strokeWidth={1.8} />
        </Link>
      </div>

      {/* Hero */}
      <div className="px-5 pb-6 pt-12">
        <h1
          className="text-[44px] leading-[1.03] tracking-[-0.05em] text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          What needs<br />to move?
        </h1>
        <p className="mt-3 max-w-[28ch] text-[15px] leading-[1.5] text-[var(--text-secondary)]">
          Tell us once. We&apos;ll match you with a driver already going that way.
        </p>
      </div>

      {/* Route input card */}
      <div className="px-5">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-3.5 shadow-[var(--shadow-card)]">
          <Link
            href="/move/new"
            className="block rounded-[var(--radius-lg)] bg-[var(--bg-elevated-2)]"
          >
            <div className="flex items-center gap-3 px-3.5 py-3.5">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-[var(--text-primary)]" />
              <span className="text-[15px] text-[var(--text-tertiary)]">From — suburb or address</span>
            </div>
            <div className="mx-3.5 h-px bg-[var(--border-subtle)]" />
            <div className="flex items-center gap-3 px-3.5 py-3.5">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
              <span className="text-[15px] text-[var(--text-tertiary)]">To</span>
            </div>
          </Link>

          <Button asChild className="mt-3.5 w-full rounded-[var(--radius-lg)]">
            <Link href="/move/new">
              Tell MoveMate your move
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-2.5 text-center text-[12px] text-[var(--text-tertiary)]">
            Need first. Ranked spare-capacity matches with clear pricing.
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="px-5 pt-7">
        <p className="eyebrow mb-2.5">Start from</p>
        <div className="flex flex-col gap-2.5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <Link
                key={preset.label}
                href={preset.href}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-4 py-3.5 shadow-[var(--shadow-card)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-[500] leading-[1.2] text-[var(--text-primary)]">{preset.label}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{preset.detail}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--text-tertiary)]" strokeWidth={1.6} />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1" />

      {/* Carrier side-door — understated */}
      <div className="flex justify-center px-5 pb-8 pt-5">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Have spare space in your van?{" "}
          <Link
            href="/carrier"
            className="inline-flex min-h-[44px] items-center font-[500] text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-[3px] hover:no-underline"
          >
            Drive with MoveMate
          </Link>
        </p>
      </div>
    </main>
  );
}
