import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] shadow-[var(--shadow-card)] transition-colors",
        className,
      )}
      {...props}
    />
  );
}
