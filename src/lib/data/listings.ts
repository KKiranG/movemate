import { hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { geocodeAddress } from "@/lib/maps/geocode";
import { getDistanceKmBetweenPoints } from "@/lib/maps/haversine";
import { suggestPrice } from "@/lib/pricing/suggest";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { RoutePriceGuidance, SpaceSize } from "@/types/trip";

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * ratio)));
  return values[index] ?? values[0] ?? 0;
}

function parsePoint(point: unknown) {
  if (typeof point !== "string") {
    return null;
  }

  const match = point.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);

  if (!match) {
    return null;
  }

  return {
    lng: Number(match[1]),
    lat: Number(match[2]),
  };
}

async function resolveGuidanceCoordinates(params: {
  originSuburb: string;
  destinationSuburb: string;
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) {
  if (
    typeof params.originLatitude === "number" &&
    typeof params.originLongitude === "number" &&
    typeof params.destinationLatitude === "number" &&
    typeof params.destinationLongitude === "number"
  ) {
    return {
      origin: { lat: params.originLatitude, lng: params.originLongitude },
      destination: { lat: params.destinationLatitude, lng: params.destinationLongitude },
    };
  }

  const [originResult, destinationResult] = await Promise.all([
    geocodeAddress(`${params.originSuburb}, Australia`),
    geocodeAddress(`${params.destinationSuburb}, Australia`),
  ]);

  if (!originResult[0] || !destinationResult[0]) {
    return null;
  }

  return {
    origin: originResult[0].location,
    destination: destinationResult[0].location,
  };
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
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}): Promise<RoutePriceGuidance> {
  const resolved = await resolveGuidanceCoordinates(params).catch(() => null);
  const fallbackDistanceKm = resolved
    ? getDistanceKmBetweenPoints(resolved.origin, resolved.destination)
    : 35;
  const fallbackSuggestion = suggestPrice({
    distanceKm: fallbackDistanceKm,
    spaceSize: params.fallbackSpaceSize,
    needsStairs: false,
    needsHelper: false,
    isReturn: false,
  });

  if (!hasSupabaseEnv() || !resolved) {
    return {
      exampleCount: 0,
      lowCents: fallbackSuggestion.lowCents,
      highCents: fallbackSuggestion.highCents,
      medianCents: fallbackSuggestion.midCents,
      usedFallback: true,
      explanation:
        "Distance-matched pricing is unavailable right now, so this uses moverrr's spare-capacity guide for the corridor instead.",
    };
  }

  const targetDistanceKm = getDistanceKmBetweenPoints(resolved.origin, resolved.destination);
  const endpointThresholdKm = targetDistanceKm >= 80 ? 20 : 12;
  const routeDistanceThresholdKm = Math.max(20, targetDistanceKm * 0.25);
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("capacity_listings")
    .select("price_cents, origin_point, destination_point")
    .in("status", ["active", "booked_partial", "booked_full", "expired"])
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw new AppError(error.message, 500, "listing_price_guidance_failed");
  }

  const values = (data ?? [])
    .map((row) => {
      const originPoint = parsePoint(row.origin_point);
      const destinationPoint = parsePoint(row.destination_point);

      if (!originPoint || !destinationPoint) {
        return null;
      }

      const originDistanceKm = getDistanceKmBetweenPoints(resolved.origin, originPoint);
      const destinationDistanceKm = getDistanceKmBetweenPoints(resolved.destination, destinationPoint);
      const sampleDistanceKm = getDistanceKmBetweenPoints(originPoint, destinationPoint);
      const routeDistanceDeltaKm = Math.abs(sampleDistanceKm - targetDistanceKm);

      if (
        originDistanceKm > endpointThresholdKm ||
        destinationDistanceKm > endpointThresholdKm ||
        routeDistanceDeltaKm > routeDistanceThresholdKm
      ) {
        return null;
      }

      return row.price_cents;
    })
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);

  if (values.length < 3) {
    return {
      exampleCount: values.length,
      lowCents: fallbackSuggestion.lowCents,
      highCents: fallbackSuggestion.highCents,
      medianCents: fallbackSuggestion.midCents,
      usedFallback: true,
      explanation:
        "Not enough maps-backed corridor examples exist yet, so this is using moverrr's spare-capacity guide instead of weaker suburb-name matching.",
    };
  }

  return {
    exampleCount: values.length,
    lowCents: percentile(values, 0.15),
    highCents: percentile(values, 0.85),
    medianCents: percentile(values, 0.5),
    usedFallback: false,
    explanation:
      "This range comes from recent moverrr listings with similar origin, destination, and route distance using maps-backed corridor matching.",
  };
}
