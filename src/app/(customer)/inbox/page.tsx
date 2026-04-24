"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyStateCard } from "@/components/spec/cards";
import { TopAppBar } from "@/components/spec/chrome";
import { inboxThreads } from "@/lib/spec-mocks";

type InboxTab = "all" | "unread";

export default function InboxPage() {
  const [tab, setTab] = useState<InboxTab>("all");

  const threads = useMemo(() => {
    if (tab === "unread") {
      return inboxThreads.filter((thread) => thread.unread);
    }

    return inboxThreads;
  }, [tab]);

  return (
    <main className="pb-8">
      <TopAppBar title="Inbox" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Updates</p>
          <h1 className="heading">Booking updates, not noisy chat</h1>
          <p className="body text-[var(--text-secondary)]">
            MoveMate keeps coordination structured so you can follow the move without message chaos.
          </p>
        </div>

        <div className="rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-1 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2 gap-1 text-center text-[13px]">
            {([
              ["all", "All"],
              ["unread", "Unread"],
            ] as const).map(([key, label]) => (
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
                {label}
              </button>
            ))}
          </div>
        </div>

        {threads.length === 0 ? (
          <EmptyStateCard title="No messages yet" description="We’ll show booking and system updates here." />
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={thread.href}
                className="block rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-4 shadow-[var(--shadow-card)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="title">{thread.title}</p>
                  <p className="caption">{thread.timestamp}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="caption">{thread.preview}</p>
                  {thread.unread ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
