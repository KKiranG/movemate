"use client";

import { useEffect, useMemo, useState } from "react";

function formatRemainingTime(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function PendingExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const deadline = useMemo(() => new Date(expiresAt), [expiresAt]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const remainingMs = deadline.getTime() - now;
  const hasExpired = remainingMs <= 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-sm font-medium text-text">
        {hasExpired
          ? "The 2-hour response window has ended."
          : `Carrier response window: expires in ${formatRemainingTime(remainingMs)}.`}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {hasExpired
          ? "If the carrier has not responded yet, this pending booking should auto-expire shortly and free the trip capacity again."
          : "Pending requests are held for up to 2 hours so carriers can confirm genuine spare-capacity bookings quickly."}
      </p>
    </div>
  );
}
