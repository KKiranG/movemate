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
        "inline-flex items-center rounded-xl border border-border px-2.5 py-1 text-xs font-medium text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

const statusBadgeMap: Record<BookingStatus, string> = {
  pending: "border-warning/30 bg-warning/10 text-warning",
  confirmed: "border-success/30 bg-success/10 text-success",
  picked_up: "border-accent/20 bg-accent/10 text-accent",
  in_transit: "border-accent/20 bg-accent/10 text-accent",
  delivered: "border-border bg-black/[0.03] text-text dark:bg-white/[0.06]",
  completed: "border-border bg-black/[0.03] text-text dark:bg-white/[0.06]",
  cancelled: "border-border bg-black/[0.03] text-text-secondary dark:bg-white/[0.04]",
  disputed: "border-error/30 bg-error/10 text-error",
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
