import { DEFAULT_DEDICATED_ESTIMATES } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { RoutePriceGuidance, SpaceSize } from "@/types/trip";

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * ratio)));
  return values[index] ?? values[0] ?? 0;
}

export function getCapacityIndicator(remainingCapacityPct: number) {
  if (remainingCapacityPct < 30) {
    return {
      label: "Almost full",
      tone: "warning" as const,
      description: `${remainingCapacityPct}% space left on this trip.`,
    };
  }

  if (remainingCapacityPct < 65) {
    return {
      label: "Spots remaining",
      tone: "neutral" as const,
      description: `${remainingCapacityPct}% spare capacity still open.`,
    };
  }

  return null;
}

export async function getRoutePriceGuidance(params: {
  originSuburb: string;
  destinationSuburb: string;
  fallbackSpaceSize: SpaceSize;
}): Promise<RoutePriceGuidance> {
  const fallbackMid = DEFAULT_DEDICATED_ESTIMATES[params.fallbackSpaceSize] * 0.62;
  const fallbackLow = Math.round(fallbackMid * 0.82);
  const fallbackHigh = Math.round(fallbackMid * 1.18);

  if (!hasSupabaseEnv()) {
    return {
      exampleCount: 0,
      lowCents: fallbackLow,
      highCents: fallbackHigh,
      medianCents: Math.round(fallbackMid),
      usedFallback: true,
      explanation:
        "Spare-capacity pricing usually lands well below a dedicated van because the route is already happening.",
    };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capacity_listings")
    .select("price_cents")
    .ilike("origin_suburb", `%${params.originSuburb}%`)
    .ilike("destination_suburb", `%${params.destinationSuburb}%`)
    .in("status", ["active", "booked_partial", "booked_full", "expired"])
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new AppError(error.message, 500, "listing_price_guidance_failed");
  }

  const values = (data ?? [])
    .map((row) => row.price_cents)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);

  if (values.length < 5) {
    return {
      exampleCount: values.length,
      lowCents: fallbackLow,
      highCents: fallbackHigh,
      medianCents: Math.round(fallbackMid),
      usedFallback: true,
      explanation:
        "Not enough exact corridor data yet, so this uses our Sydney spare-capacity guide rather than dedicated-truck pricing.",
    };
  }

  return {
    exampleCount: values.length,
    lowCents: percentile(values, 0.15),
    highCents: percentile(values, 0.85),
    medianCents: percentile(values, 0.5),
    usedFallback: false,
    explanation:
      "This range comes from recent moverrr listings on a similar corridor, which is usually cheaper than booking a dedicated truck for the whole run.",
  };
}
