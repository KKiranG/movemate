"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      if (parsed.when !== undefined) {
        setWhen(parsed.when >= defaultDate ? parsed.when : defaultDate);
      }
      if (parsed.what !== undefined) setWhat(parsed.what);
      if (parsed.backload !== undefined) setBackload(parsed.backload);
      if (parsed.sort !== undefined) setSort(parsed.sort);
    } catch {
      window.localStorage.removeItem("moverrr:search:draft");
    }
  }, [defaultDate, hasUrlDefaults]);

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

  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/search") {
      return;
    }

    const shouldScroll = window.sessionStorage.getItem("moverrr:search:scroll-to-results");

    if (shouldScroll !== "1") {
      return;
    }

    window.sessionStorage.removeItem("moverrr:search:scroll-to-results");

    const target = document.getElementById("search-results");

    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [pathname, searchParams]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (from.trim()) params.set("from", from.trim());
    if (to.trim()) params.set("to", to.trim());
    params.set("when", when && when >= defaultDate ? when : defaultDate);
    if (what) params.set("what", what);
    if (backload) params.set("backload", "1");
    if (sort !== "date") params.set("sort", sort);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("moverrr:search:scroll-to-results", "1");
    }

    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      id="search-form"
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
            aria-label="Moving from suburb"
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
            aria-label="Moving to suburb"
          />
        </label>
      </div>

      <div className="hidden gap-2 sm:grid">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text">Browse by item category</span>
          <span className="text-xs text-text-secondary">Secondary intent friendly</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SEARCH_CATEGORY_OPTIONS.map((option) => (
            <label key={option.value} className="block">
              <input
                type="radio"
                name="what-desktop"
                value={option.value}
                checked={what === option.value}
                onChange={() => setWhat(option.value)}
                className="peer sr-only"
              />
              <span className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-center text-sm text-text transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent active:bg-black/[0.04] dark:active:bg-white/[0.08] peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:outline-none">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[1fr_1fr_auto_auto]">
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
        <label className="hidden min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 active:bg-black/[0.04] dark:active:bg-white/[0.08] sm:flex focus-within:ring-2 focus-within:ring-accent focus-within:outline-none">
          <input
            type="checkbox"
            name="backload-desktop"
            value="1"
            checked={backload}
            onChange={(event) => setBackload(event.target.checked)}
            className="h-4 w-4 accent-accent focus:outline-none"
            aria-label="Return trip only"
          />
          <div className="flex-1">
            <span className="block text-sm font-medium text-text">Return trip only</span>
            <span className="text-xs text-text-secondary">
              Return trips often have the best prices because the carrier is already coming back.
            </span>
          </div>
        </label>
        <label className="hidden flex-col gap-2 sm:flex">
          <span className="text-sm font-medium text-text">Sort by</span>
          <select
            name="sort-desktop"
            value={sort}
            onChange={(event) => setSort(event.target.value as SearchSort)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
          >
            <option value="date">Date (earliest)</option>
            <option value="price">Price (lowest)</option>
            <option value="rating">Rating (highest)</option>
          </select>
        </label>
        <Button type="submit" className="mt-auto min-h-[44px] gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      <details className="group rounded-xl border border-border p-3 sm:hidden">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text [&::-webkit-details-marker]:hidden">
          <span>Filters</span>
          <span className="text-xs uppercase tracking-[0.18em] text-text-secondary group-open:hidden">
            Open
          </span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-text-secondary group-open:block">
            Close
          </span>
        </summary>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Item category</span>
              <span className="text-xs text-text-secondary">Optional</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SEARCH_CATEGORY_OPTIONS.map((option) => (
                <label key={option.value} className="block">
                  <input
                    type="radio"
                    name="what-mobile"
                    value={option.value}
                    checked={what === option.value}
                    onChange={() => setWhat(option.value)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-center text-sm text-text transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent active:bg-black/[0.04] dark:active:bg-white/[0.08] peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:outline-none">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 active:bg-black/[0.04] dark:active:bg-white/[0.08] focus-within:ring-2 focus-within:ring-accent focus-within:outline-none">
            <input
              type="checkbox"
              name="backload-mobile"
              value="1"
              checked={backload}
              onChange={(event) => setBackload(event.target.checked)}
              className="h-4 w-4 accent-accent focus:outline-none"
              aria-label="Return trip only"
            />
            <div className="flex-1">
              <span className="block text-sm font-medium text-text">Return trip only</span>
              <span className="text-xs text-text-secondary">
                Return trips often have the best prices because the carrier is already coming back.
              </span>
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Sort by</span>
            <select
              name="sort-mobile"
              value={sort}
              onChange={(event) => setSort(event.target.value as SearchSort)}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              <option value="date">Date (earliest)</option>
              <option value="price">Price (lowest)</option>
              <option value="rating">Rating (highest)</option>
            </select>
          </label>
        </div>
      </details>
    </form>
  );
}
