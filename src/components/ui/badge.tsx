import * as React from "react";

import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-1 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

const statusBadgeMap: Record<BookingStatus, string> = {
  pending: "border-[color:var(--warning)]/30 bg-[var(--warning-subtle)] text-[var(--warning)]",
  confirmed: "border-[color:var(--success)]/30 bg-[var(--success-subtle)] text-[var(--success)]",
  picked_up: "border-[color:var(--accent)]/30 bg-[var(--accent-subtle)] text-[var(--accent)]",
  in_transit: "border-[color:var(--accent)]/30 bg-[var(--accent-subtle)] text-[var(--accent)]",
  delivered: "border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]",
  completed: "border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]",
  cancelled: "border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] text-[var(--text-secondary)]",
  disputed: "border-[color:var(--danger)]/30 bg-[color:rgba(166,50,28,0.12)] text-[var(--danger)]",
};

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(statusBadgeMap[status], className)}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
