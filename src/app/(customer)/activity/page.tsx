"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyStateCard } from "@/components/spec/cards";
import { TopAppBar } from "@/components/spec/chrome";
import { activityItems } from "@/lib/spec-mocks";

type ActivityTab = "active" | "alerts" | "past";

const tabLabels: Record<ActivityTab, string> = {
  active: "Active",
  alerts: "Alerts",
  past: "Past",
};

export default function ActivityPage() {
  const [tab, setTab] = useState<ActivityTab>("active");
  const visibleItems = useMemo(() => activityItems[tab], [tab]);

  return (
    <main className="pb-8">
      <TopAppBar title="Your moves" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Activity</p>
          <h1 className="heading">Everything currently moving</h1>
          <p className="body text-[var(--text-secondary)]">
            Requests, live bookings, and recovery paths stay together here so you don’t lose the thread.
          </p>
        </div>

        <div className="rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-1 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-3 gap-1 text-center text-[13px]">
            {(Object.keys(tabLabels) as ActivityTab[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-h-[46px] min-w-[44px] rounded-[var(--radius-pill)] ${
                  tab === key
                    ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                }`}
              >
                {tabLabels[key]}
              </button>
            ))}
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <EmptyStateCard
            title="Your moves will appear here"
            description="Start a new move request and moverrr will keep the status trail in one place."
            ctaHref="/move/new"
            ctaLabel="Start a move"
          />
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-4 shadow-[var(--shadow-card)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
              >
                <p className="title">{item.title}</p>
                <p className="mt-1 caption">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
