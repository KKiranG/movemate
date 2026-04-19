import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/utils";

type Action = {
  href: string;
  label: string;
  tone?: "default" | "primary";
  operational?: boolean;
};

export function CarrierScaffoldPage({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: Action[];
  children?: ReactNode;
}) {
  return (
    <main id="main-content" className="screen safe-bottom-pad app-scroll space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))]">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <Wordmark color="#f7f6f2" />
          <p className="rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Carrier
          </p>
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="heading max-w-[13ch]">{title}</h1>
        <p className="max-w-[34ch] text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p>
      </header>

      {actions && actions.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map((action) => (
            <ScaffoldAction key={`${action.href}-${action.label}`} action={action} />
          ))}
        </div>
      ) : null}

      {children}
    </main>
  );
}

export function ScaffoldCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="surface-1 p-4">
      <h2 className="title">{title}</h2>
      {description ? <p className="mt-1 caption">{description}</p> : null}
      {children ? <div className="mt-3 grid gap-2">{children}</div> : null}
    </Card>
  );
}

function ScaffoldAction({ action }: { action: Action }) {
  return (
    <Link
      href={action.href}
      className={cn(
        "inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 text-center text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
        action.operational ? "touch-52" : "min-h-[44px]",
        action.tone === "primary"
          ? "border-transparent bg-[var(--bg-elevated-1)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          : "",
      )}
    >
      {action.label}
    </Link>
  );
}

export function KeyValueList({
  items,
}: {
  items: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] p-3"
        >
          <p className="caption">{item.label}</p>
          <p className="body font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
