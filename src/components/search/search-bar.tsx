"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTodayIsoDate } from "@/lib/utils";
import type { ItemCategory } from "@/types/trip";

type SearchIntent =
  | "single_furniture"
  | "appliance"
  | "marketplace_pickup"
  | "student_move"
  | "office_overflow"
  | "boxes";

const SEARCH_INTENT_OPTIONS: Array<{
  value: SearchIntent;
  label: string;
  category: ItemCategory;
}> = [
  {
    value: "single_furniture",
    label: "Single furniture",
    category: "furniture",
  },
  { value: "appliance", label: "Appliance", category: "appliance" },
  {
    value: "marketplace_pickup",
    label: "Marketplace pickup",
    category: "furniture",
  },
  { value: "student_move", label: "Student move", category: "boxes" },
  { value: "office_overflow", label: "Office overflow", category: "boxes" },
  { value: "boxes", label: "Boxes", category: "boxes" },
];

function getIntentForCategory(category: ItemCategory) {
  return (
    SEARCH_INTENT_OPTIONS.find((option) => option.category === category)
      ?.value ?? "single_furniture"
  );
}

export function SearchBar({
  defaults,
}: {
  defaults?: {
    from?: string;
    to?: string;
    when?: string;
    what?: ItemCategory;
    intent?: SearchIntent;
    backload?: boolean;
    flexibleDates?: boolean;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromRef = useRef<HTMLInputElement>(null);
  const hasUrlDefaults = Boolean(
    defaults?.from ||
    defaults?.to ||
    defaults?.when ||
    defaults?.what ||
    defaults?.intent ||
    defaults?.backload ||
    defaults?.flexibleDates,
  );
  const [from, setFrom] = useState(defaults?.from ?? "");
  const [to, setTo] = useState(defaults?.to ?? "");
  const [when, setWhen] = useState(defaults?.when ?? getTodayIsoDate());
  const [intent, setIntent] = useState<SearchIntent>(
    defaults?.intent ?? getIntentForCategory(defaults?.what ?? "furniture"),
  );
  const [backload, setBackload] = useState(defaults?.backload ?? false);
  const [flexibleDates, setFlexibleDates] = useState(
    defaults?.flexibleDates ?? false,
  );

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
        intent: SearchIntent;
        backload: boolean;
        flexibleDates: boolean;
      }>;

      if (parsed.from !== undefined) setFrom(parsed.from);
      if (parsed.to !== undefined) setTo(parsed.to);
      if (parsed.when !== undefined) {
        setWhen(parsed.when >= defaultDate ? parsed.when : defaultDate);
      }
      if (parsed.intent !== undefined) setIntent(parsed.intent);
      if (parsed.backload !== undefined) setBackload(parsed.backload);
      if (parsed.flexibleDates !== undefined)
        setFlexibleDates(parsed.flexibleDates);
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
      JSON.stringify({ from, to, when, intent, backload, flexibleDates }),
    );
  }, [backload, flexibleDates, from, intent, to, when]);

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

    const shouldScroll = window.sessionStorage.getItem(
      "moverrr:search:scroll-to-results",
    );

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
    const category =
      SEARCH_INTENT_OPTIONS.find((option) => option.value === intent)
        ?.category ?? "furniture";

    if (from.trim()) params.set("from", from.trim());
    if (to.trim()) params.set("to", to.trim());
    params.set("when", when && when >= defaultDate ? when : defaultDate);
    params.set("what", category);
    params.set("intent", intent);
    if (backload) params.set("backload", "1");
    if (flexibleDates) params.set("flex", "1");

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
      aria-label="Tell moverrr what needs moving"
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
          <span className="text-sm font-medium text-text">
            What are you moving?
          </span>
          <span className="text-xs text-text-secondary">
            Choose the closest move type
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SEARCH_INTENT_OPTIONS.map((option) => (
            <label key={option.value} className="block">
              <input
                type="radio"
                name="intent-desktop"
                value={option.value}
                checked={intent === option.value}
                onChange={() => setIntent(option.value)}
                className="peer sr-only"
              />
              <span className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-center text-sm text-text transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent active:bg-black/[0.04] dark:active:bg-white/[0.08] peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:outline-none">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
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
            name="flexible-dates-desktop"
            checked={flexibleDates}
            onChange={(event) => setFlexibleDates(event.target.checked)}
            className="h-4 w-4 accent-accent focus:outline-none"
            aria-label="Flexible dates"
          />
          <div className="flex-1">
            <span className="block text-sm font-medium text-text">
              Flexible dates
            </span>
            <span className="text-xs text-text-secondary">
              Search this day plus 3 days either side.
            </span>
          </div>
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
            <span className="block text-sm font-medium text-text">
              Return trip only
            </span>
            <span className="text-xs text-text-secondary">
              Return trips often have the best prices because the carrier is
              already coming back.
            </span>
          </div>
        </label>
        <Button type="submit" className="mt-auto min-h-[44px] gap-2">
          <Search className="h-4 w-4" />
          See matches
        </Button>
      </div>

      <details className="group rounded-xl border border-border p-3 sm:hidden">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text [&::-webkit-details-marker]:hidden">
          <span>More options</span>
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
              <span className="text-sm font-medium text-text">Item type</span>
              <span className="text-xs text-text-secondary">Optional</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SEARCH_INTENT_OPTIONS.map((option) => (
                <label key={option.value} className="block">
                  <input
                    type="radio"
                    name="intent-mobile"
                    value={option.value}
                    checked={intent === option.value}
                    onChange={() => setIntent(option.value)}
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
              name="flexible-dates-mobile"
              checked={flexibleDates}
              onChange={(event) => setFlexibleDates(event.target.checked)}
              className="h-4 w-4 accent-accent focus:outline-none"
              aria-label="Flexible dates"
            />
            <div className="flex-1">
              <span className="block text-sm font-medium text-text">
                Flexible dates
              </span>
              <span className="text-xs text-text-secondary">
                Include nearby dates when the exact day is sparse.
              </span>
            </div>
          </label>
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
              <span className="block text-sm font-medium text-text">
                Return trip only
              </span>
              <span className="text-xs text-text-secondary">
                Return trips often have the best prices because the carrier is
                already coming back.
              </span>
            </div>
          </label>
        </div>
      </details>
    </form>
  );
}
