"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function StickyBookingCta({
  priceCents,
  savingsCents,
}: {
  priceCents: number;
  savingsCents?: number | null;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Book now</p>
          <p className="truncate text-sm font-medium text-text">
            {formatCurrency(priceCents)}
            {savingsCents && savingsCents > 0 ? (
              <span className="ml-2 text-xs font-normal text-success">
                save {formatCurrency(savingsCents)}
              </span>
            ) : null}
          </p>
        </div>
        <Button asChild size="sm" className="min-h-[44px]">
          <a href="#booking-form">Book into this trip</a>
        </Button>
      </div>
    </div>
  );
}
