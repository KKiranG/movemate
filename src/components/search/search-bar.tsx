"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEARCH_CATEGORY_OPTIONS } from "@/lib/constants";
import { getTodayIsoDate } from "@/lib/utils";
import type { ItemCategory } from "@/types/trip";

type SearchSort = "date" | "price" | "rating";

export function SearchBar({
  defaults,
}: {
  defaults?: {
    from?: string;
    to?: string;
    when?: string;
    what?: ItemCategory;
    backload?: boolean;
    sort?: SearchSort;
  };
}) {
  const router = useRouter();
  const fromRef = useRef<HTMLInputElement>(null);
  const hasUrlDefaults = Boolean(
    defaults?.from || defaults?.to || defaults?.when || defaults?.what || defaults?.backload,
  );
  const [from, setFrom] = useState(defaults?.from ?? "");
  const [to, setTo] = useState(defaults?.to ?? "");
  const [when, setWhen] = useState(defaults?.when ?? getTodayIsoDate());
  const [what, setWhat] = useState<ItemCategory>(defaults?.what ?? "furniture");
  const [backload, setBackload] = useState(defaults?.backload ?? false);
  const [sort, setSort] = useState<SearchSort>(defaults?.sort ?? "date");

  const defaultDate = useMemo(() => getTodayIsoDate(), []);

  useEffect(() => {
    if (typeof window === "undefined" || hasUrlDefaults) {
      return;
    }

    try {
      const saved = window.localStorage.getItem("moverrr:search:draft");

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved) as Partial<{
        from: string;
        to: string;
        when: string;
        what: ItemCategory;
        backload: boolean;
        sort: SearchSort;
      }>;

      if (parsed.from !== undefined) setFrom(parsed.from);
      if (parsed.to !== undefined) setTo(parsed.to);
      if (parsed.when !== undefined) setWhen(parsed.when);
      if (parsed.what !== undefined) setWhat(parsed.what);
      if (parsed.backload !== undefined) setBackload(parsed.backload);
      if (parsed.sort !== undefined) setSort(parsed.sort);
    } catch {
      window.localStorage.removeItem("moverrr:search:draft");
    }
  }, [hasUrlDefaults]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "moverrr:search:draft",
      JSON.stringify({ from, to, when, what, backload, sort }),
    );
  }, [backload, from, sort, to, what, when]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 640px)");

    if (!mediaQuery.matches) {
      return;
    }

    const timeout = window.setTimeout(() => {
      fromRef.current?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (from.trim()) params.set("from", from.trim());
    if (to.trim()) params.set("to", to.trim());
    if (when) params.set("when", when);
    if (what) params.set("what", what);
    if (backload) params.set("backload", "1");
    if (sort !== "date") params.set("sort", sort);

    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-card flex flex-col gap-3 p-4"
      aria-label="Search available trips"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Moving from</span>
          <Input
            ref={fromRef}
            name="from"
            placeholder="Search suburbs"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            autoComplete="address-level2"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Moving to</span>
          <Input
            name="to"
            placeholder="Search suburbs"
            value={to}
            onChange={(event) => setTo(event.target.value)}
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
                checked={what === option.value}
                onChange={() => setWhat(option.value)}
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
          <Input
            name="when"
            type="date"
            value={when}
            min={defaultDate}
            onChange={(event) => setWhen(event.target.value)}
          />
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
            checked={backload}
            onChange={(event) => setBackload(event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Sort by</span>
          <select
            name="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SearchSort)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
          >
            <option value="date">Date (earliest)</option>
            <option value="price">Price (lowest)</option>
            <option value="rating">Rating (highest)</option>
          </select>
        </label>
        <Button type="submit" className="mt-auto gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </form>
  );
}
