import Link from "next/link";
import { ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";

import type { OfferCard, PriceLine, TimelineStep } from "@/lib/spec-mocks";
import { cn } from "@/lib/utils";

const matchClassStyle: Record<OfferCard["matchClass"], string> = {
  direct: "bg-[var(--success-subtle)] text-[var(--success)]",
  near: "bg-[var(--warning-subtle)] text-[var(--warning)]",
  partial: "bg-[var(--bg-elevated-2)] text-[var(--text-secondary)]",
};

export function ResultCard({ offer }: { offer: OfferCard }) {
  return (
    <Link
      href={`/move/new/results/${offer.id}`}
      className="block rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="title">{offer.carrierName}</p>
            <span className="inline-flex h-6 items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] px-2 text-[11px] font-semibold text-[var(--text-secondary)]">
              <ShieldCheck size={12} />
              Verified
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{offer.ratingLabel}</p>
          <p className="text-[13px] text-[var(--text-tertiary)]">{offer.vehicle}</p>
        </div>
        <div className="text-right">
          <p className="tabular text-[28px] font-semibold leading-none tracking-[-0.04em] text-[var(--text-primary)]">
            {offer.total}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            all-in
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] px-4 py-3">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Why this matches</p>
        <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{offer.why}</p>
        <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
          {offer.route} · {offer.schedule}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex min-h-[28px] items-center rounded-[var(--radius-pill)] px-3 text-[12px] font-semibold",
              matchClassStyle[offer.matchClass],
            )}
          >
            {offer.fit}
          </span>
          {offer.tags?.[0] ? (
            <span className="inline-flex min-h-[28px] items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-3 text-[12px] font-medium text-[var(--text-secondary)]">
              {offer.tags[0]}
            </span>
          ) : null}
        </div>
        <ChevronRight size={20} className="text-[var(--text-tertiary)]" />
      </div>
    </Link>
  );
}

export function CollapsibleResults({
  title,
  count,
  children,
  openByDefault = false,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  openByDefault?: boolean;
}) {
  return (
    <details open={openByDefault} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-3 shadow-[var(--shadow-card)]">
      <summary className="flex min-h-[48px] list-none items-center justify-between gap-2 rounded-[var(--radius-md)] px-2 text-[15px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]">
        <span>{title}</span>
        <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]">
          {count}
          <ChevronDown size={18} />
        </span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export function InfoCard({
  title,
  description,
  ctaLabel,
  href,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  href?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:rgba(201,82,28,0.22)] bg-[var(--accent-subtle)] p-4">
      <p className="title">{title}</p>
      <p className="mt-2 caption">{description}</p>
      {href && ctaLabel ? (
        <Link
          href={href}
          className="mt-4 inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function PriceBreakdown({
  lines,
  total,
}: {
  lines: ReadonlyArray<PriceLine>;
  total: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-4 shadow-[var(--shadow-card)]">
      <div className="space-y-2 text-[15px] leading-[22px]">
        {lines.map((line) => (
          <p key={line.label} className="tabular flex justify-between gap-3">
            <span className="text-[var(--text-secondary)]">{line.label}</span>
            <span className="text-[var(--text-primary)]">{line.value}</span>
          </p>
        ))}
      </div>
      <div className="my-3 h-px bg-[var(--border-subtle)]" />
      <p className="tabular flex justify-between text-[20px] font-semibold tracking-[-0.03em]">
        <span>Total</span>
        <span>{total}</span>
      </p>
    </div>
  );
}

export function Timeline({ steps }: { steps: ReadonlyArray<TimelineStep> }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-4 shadow-[var(--shadow-card)]">
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.title} className="flex gap-3">
            <span
              className={cn(
                "mt-1 h-3 w-3 rounded-full",
                step.state === "complete" && "bg-[var(--text-primary)]",
                step.state === "current" && "bg-[var(--accent)]",
                step.state === "future" && "border border-[var(--border-strong)] bg-transparent",
              )}
            />
            <div>
              <p className={cn("body font-medium", step.state === "future" ? "text-[var(--text-tertiary)]" : "")}>
                {step.title}
              </p>
              {step.note ? <p className="caption">{step.note}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyStateCard({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-5 text-center shadow-[var(--shadow-card)]">
      <p className="title">{title}</p>
      <p className="mt-2 caption">{description}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
