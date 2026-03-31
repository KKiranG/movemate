import type { Booking } from "@/types/booking";
import type { Database } from "@/types/database";
import type { ItemCategory } from "@/types/trip";

type CapacityListingSnapshot = Pick<
  Database["public"]["Tables"]["capacity_listings"]["Row"],
  "available_volume_m3" | "available_weight_kg"
>;

type CapacityBookingSnapshot = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "item_dimensions" | "item_weight_kg" | "item_category"
> &
  Partial<Pick<Booking, "status">>;

const CATEGORY_FALLBACK_CAPACITY_PCT: Record<ItemCategory, number> = {
  furniture: 35,
  boxes: 15,
  appliance: 30,
  fragile: 20,
  other: 20,
};

function parseDimensionTokens(value: string) {
  return Array.from(value.matchAll(/(\d+(?:\.\d+)?)\s*(cm|m)?/gi))
    .slice(0, 3)
    .map((match) => ({
      amount: Number(match[1]),
      unit: match[2]?.toLowerCase() ?? null,
    }))
    .filter((token) => Number.isFinite(token.amount) && token.amount > 0);
}

export function parseItemVolumeCubicMeters(value?: string | null) {
  if (!value) {
    return null;
  }

  const tokens = parseDimensionTokens(value);

  if (tokens.length < 3) {
    return null;
  }

  const hasExplicitMeters = tokens.some((token) => token.unit === "m");
  const hasExplicitCentimeters = tokens.some((token) => token.unit === "cm");
  const largestRawValue = Math.max(...tokens.map((token) => token.amount));

  const valuesInMeters = tokens.map((token) => {
    if (token.unit === "m") {
      return token.amount;
    }

    if (token.unit === "cm") {
      return token.amount / 100;
    }

    if (hasExplicitMeters && !hasExplicitCentimeters) {
      return token.amount;
    }

    return largestRawValue <= 10 ? token.amount : token.amount / 100;
  });

  const volumeM3 = valuesInMeters.reduce((product, current) => product * current, 1);

  return volumeM3 > 0 ? volumeM3 : null;
}

export function estimateBookingCapacityPct(params: {
  listingAvailableVolumeM3?: number | null;
  listingAvailableWeightKg?: number | null;
  itemDimensions?: string | null;
  itemWeightKg?: number | null;
  itemCategory?: string | null;
}) {
  const volumeM3 = parseItemVolumeCubicMeters(params.itemDimensions);
  const listingVolumeM3 = Number(params.listingAvailableVolumeM3 ?? 0);
  const listingWeightKg = Number(params.listingAvailableWeightKg ?? 0);
  const itemWeightKg = Number(params.itemWeightKg ?? 0);

  const volumePct =
    volumeM3 && listingVolumeM3 > 0 ? Math.ceil((volumeM3 / listingVolumeM3) * 100) : 0;
  const weightPct =
    itemWeightKg > 0 && listingWeightKg > 0
      ? Math.ceil((itemWeightKg / listingWeightKg) * 100)
      : 0;

  const fallbackPct =
    CATEGORY_FALLBACK_CAPACITY_PCT[(params.itemCategory as ItemCategory) ?? "other"] ??
    CATEGORY_FALLBACK_CAPACITY_PCT.other;

  const estimatedPct =
    volumePct > 0 || weightPct > 0 ? Math.max(volumePct, weightPct) : fallbackPct;

  return Math.min(100, Math.max(5, estimatedPct));
}

export function getRemainingCapacityPctForListing(
  listing: CapacityListingSnapshot,
  bookings: CapacityBookingSnapshot[],
) {
  const usedCapacityPct = bookings.reduce((sum, booking) => {
    if (booking.status === "cancelled") {
      return sum;
    }

    return (
      sum +
      estimateBookingCapacityPct({
        listingAvailableVolumeM3: listing.available_volume_m3,
        listingAvailableWeightKg: listing.available_weight_kg,
        itemDimensions: booking.item_dimensions,
        itemWeightKg: Number(booking.item_weight_kg ?? 0),
        itemCategory: booking.item_category,
      })
    );
  }, 0);

  return Math.max(0, 100 - usedCapacityPct);
}

export function getListingStatusFromCapacity(
  activeBookingCount: number,
  remainingCapacityPct: number,
): Database["public"]["Tables"]["capacity_listings"]["Row"]["status"] {
  if (remainingCapacityPct <= 0) {
    return "booked_full";
  }

  if (activeBookingCount > 0) {
    return "booked_partial";
  }

  return "active";
}
