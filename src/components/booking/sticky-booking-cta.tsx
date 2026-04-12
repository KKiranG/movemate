"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function StickyBookingCta({
  priceCents,
  savingsCents,
  savingsNote,
  isBookable = true,
  href = "#booking-form",
}: {
  priceCents: number;
  savingsCents?: number | null;
  savingsNote?: string;
  isBookable?: boolean;
  href?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            {isBookable ? "Send request" : "Fully booked"}
          </p>
          <p className="truncate text-sm font-medium text-text">
            {formatCurrency(priceCents)}
            {savingsCents && savingsCents > 0 ? (
              <span className="ml-2 text-xs font-normal text-success">
                save {formatCurrency(savingsCents)}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-text-secondary">
            Starting total incl. moverrr charges
          </p>
          {savingsNote ? (
            <p className="truncate text-xs text-text-secondary">
              {savingsNote}
            </p>
          ) : null}
        </div>
        <Button asChild size="sm" className="min-h-[44px]">
          <a href={href}>{isBookable ? "Send request" : "See similar trips"}</a>
        </Button>
      </div>
    </div>
  );
}
