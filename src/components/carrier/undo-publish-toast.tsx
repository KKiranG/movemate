"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function UndoPublishToast({ tripId }: { tripId: string }) {
  const [visible, setVisible] = useState(true);
  const [isTakingOffline, setIsTakingOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(false), 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  async function handleTakeOffline() {
    if (isTakingOffline) return;
    setIsTakingOffline(true);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (response.ok) {
        setVisible(false);
        router.refresh();
      }
    } finally {
      setIsTakingOffline(false);
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-[var(--brand-ink)] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] text-[var(--brand-paper)] shadow-lg"
    >
      <p className="text-sm font-medium">Trip is live.</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isTakingOffline}
          onClick={handleTakeOffline}
          className="min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] border border-[var(--brand-paper)]/30 px-4 py-2 text-sm font-medium text-[var(--brand-paper)] hover:bg-[var(--brand-paper)]/10 active:bg-[var(--brand-paper)]/20 disabled:opacity-50"
        >
          {isTakingOffline ? "Taking offline…" : "Take offline"}
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setVisible(false)}
          className="min-h-[44px] min-w-[44px] text-[var(--brand-paper)]/70 hover:text-[var(--brand-paper)] active:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
