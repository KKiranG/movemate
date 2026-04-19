import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck2,
  ChevronLeft,
  Home,
  Inbox,
  ListChecks,
  Search,
  User,
  Wallet,
} from "lucide-react";

import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/utils";

type TabItem = {
  href: string;
  label: string;
  icon: "home" | "activity" | "inbox" | "account" | "requests" | "trips" | "payouts";
};

const iconMap = {
  home: Home,
  activity: Search,
  inbox: Inbox,
  account: User,
  requests: ListChecks,
  trips: CalendarCheck2,
  payouts: Wallet,
} as const;

export function TopAppBar({
  title,
  backHref,
  rightLabel,
  rightHref,
  tone = "light",
}: {
  title?: string | null;
  backHref?: string;
  rightLabel?: string;
  rightHref?: string;
  tone?: "light" | "dark";
}) {
  const tinted = tone === "dark";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[color:rgba(247,246,242,0.88)] px-4 pb-3 pt-[calc(var(--safe-area-top)+10px)] backdrop-blur-[18px]">
      <div className="flex items-center justify-between gap-3">
        <div className="w-12">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
              aria-label="Go back"
            >
              <ChevronLeft size={20} />
            </Link>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-center">
          {title ? (
            <p className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {title}
            </p>
          ) : (
            <Wordmark color={tinted ? "#f7f6f2" : undefined} className="justify-center" />
          )}
        </div>
        <div className="flex w-12 justify-end">
          {rightHref && rightLabel ? (
            <Link
              href={rightHref}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-transparent px-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] hover:text-[var(--text-primary)] active:bg-[var(--bg-elevated-3)] active:text-[var(--text-primary)]"
            >
              {rightLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function BottomTabBar({
  tabs,
  pathname,
  tone = "light",
}: {
  tabs: TabItem[];
  pathname: string;
  tone?: "light" | "dark";
}) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-1/2 z-40 flex w-full max-w-[460px] -translate-x-1/2 items-center justify-around border-t px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-[18px]",
        tone === "dark"
          ? "border-[var(--border-subtle)] bg-[color:rgba(20,18,15,0.88)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(247,246,242,0.9)]",
      )}
      aria-label="Primary"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = iconMap[tab.icon];

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex min-h-[48px] min-w-[52px] flex-col items-center justify-center gap-1 rounded-[18px] px-3",
              active
                ? "bg-[var(--bg-elevated-2)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-1)] active:bg-[var(--bg-elevated-2)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className={cn("text-[11px] leading-[14px]", active ? "font-semibold" : "font-medium")}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AmbientMap({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div
      className={cn(
        "relative h-[40vh] min-h-[260px] w-full overflow-hidden",
        tone === "dark" ? "bg-[#14120f]" : "bg-[#f3efe6]",
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            tone === "dark"
              ? "radial-gradient(circle at 50% 24%, rgba(255,255,255,0.08), transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%), repeating-linear-gradient(120deg, rgba(255,255,255,0.04) 0 18px, transparent 18px 36px)"
              : "radial-gradient(circle at 50% 22%, rgba(255,255,255,0.88), transparent 32%), linear-gradient(180deg, rgba(201,82,28,0.08) 0%, transparent 44%), repeating-linear-gradient(135deg, rgba(20,18,15,0.035) 0 16px, transparent 16px 32px)",
        }}
      />
      <div className="absolute left-10 top-[28%] h-3 w-3 rounded-full border-2 border-[var(--text-primary)] bg-[var(--bg-base)]" />
      <div className="absolute right-16 top-[53%] h-3 w-3 rounded-full bg-[var(--accent)]" />
      <div className="absolute left-[22%] top-[32%] h-[2px] w-[56%] rotate-[18deg] rounded-full bg-[color:rgba(20,18,15,0.16)]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[var(--bg-base)]" />
    </div>
  );
}

export function InlineBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
