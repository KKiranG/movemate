import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEARCH_CATEGORY_OPTIONS } from "@/lib/constants";
import { getTodayIsoDate } from "@/lib/utils";
import type { ItemCategory } from "@/types/trip";

export function SearchBar({
  defaults,
}: {
  defaults?: {
    from?: string;
    to?: string;
    when?: string;
    what?: ItemCategory;
    backload?: boolean;
  };
}) {
  const defaultDate = getTodayIsoDate();

  return (
    <form
      action="/search"
      className="surface-card flex flex-col gap-3 p-4"
      aria-label="Search available trips"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Moving from</span>
          <Input
            name="from"
            placeholder="Penrith"
            defaultValue={defaults?.from ?? "Penrith"}
            autoComplete="address-level2"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Moving to</span>
          <Input
            name="to"
            placeholder="Bondi"
            defaultValue={defaults?.to ?? "Bondi"}
            autoComplete="address-level2"
          />
        </label>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text">Browse by item category</span>
          <span className="text-xs text-text-secondary">Secondary intent friendly</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SEARCH_CATEGORY_OPTIONS.map((option) => (
            <label key={option.value} className="block">
              <input
                type="radio"
                name="what"
                value={option.value}
                defaultChecked={(defaults?.what ?? "furniture") === option.value}
                className="peer sr-only"
              />
              <span className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-center text-sm text-text transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent active:bg-black/[0.04] dark:active:bg-white/[0.08]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">When</span>
          <Input name="when" type="date" defaultValue={defaults?.when ?? defaultDate} />
        </label>
        <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 active:bg-black/[0.04] dark:active:bg-white/[0.08]">
          <div>
            <span className="block text-sm font-medium text-text">Return trip only</span>
            <span className="text-xs text-text-secondary">
              Backloads tend to be the sharpest savings.
            </span>
          </div>
          <input
            type="checkbox"
            name="backload"
            value="1"
            defaultChecked={defaults?.backload ?? false}
            className="h-4 w-4 accent-accent"
          />
        </label>
        <Button type="submit" className="mt-auto gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </form>
  );
}
