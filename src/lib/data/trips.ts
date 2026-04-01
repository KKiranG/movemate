import { unstable_cache } from "next/cache";

import { SEARCH_PAGE_SIZE, SEARCH_REVALIDATE_SECONDS } from "@/lib/constants";
import { hasMapsEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { geocodeAddress } from "@/lib/maps/geocode";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { toGeographyPoint, toTrip, toTripSearchResult, type ListingJoinedRecord } from "@/lib/data/mappers";
import { tripSchema, tripUpdateSchema, type TripInput, type TripUpdateInput } from "@/lib/validation/trip";
import { getDateOffsetIso, getTodayIsoDate } from "@/lib/utils";
import type { Trip, TripSearchInput, TripSearchResponse, TripSearchResult } from "@/types/trip";

type SearchRpcRow = {
  listing_id: string;
  match_score: number;
  pickup_distance_km: number;
  dropoff_distance_km: number;
};

function getJoinedTripsQuery() {
  const supabase = createServerSupabaseClient();
  return supabase.from("capacity_listings").select(
    "*, carrier:carriers(*), vehicle:vehicles(*)",
  );
}

async function queryTripsByIds(ids: string[]) {
  if (!ids.length || !hasSupabaseEnv()) {
    return [];
  }

  const query = getJoinedTripsQuery();
  const { data, error } = await query.in("id", ids);

  if (error) {
    throw new AppError(error.message, 500, "trip_query_failed");
  }

  return ((data ?? []) as unknown as ListingJoinedRecord[]).map(toTrip);
}

async function queryTripsByDateWindow(params: {
  from: string;
  to: string;
  what?: string;
  isReturnTrip?: boolean;
  dates: string[];
}) {
  if (!hasSupabaseEnv() || params.dates.length === 0) {
    return [] as TripSearchResult[];
  }

  const query = getJoinedTripsQuery()
    .in("status", ["active", "booked_partial"])
    .lte("publish_at", new Date().toISOString())
    .in("trip_date", params.dates)
    .ilike("origin_suburb", `%${params.from}%`)
    .ilike("destination_suburb", `%${params.to}%`)
    .order("trip_date", { ascending: true })
    .limit(SEARCH_PAGE_SIZE);

  if (params.what) {
    if (params.what === "furniture") {
      query.eq("accepts_furniture", true);
    }

    if (params.what === "boxes") {
      query.eq("accepts_boxes", true);
    }

    if (params.what === "appliance") {
      query.eq("accepts_appliances", true);
    }

    if (params.what === "fragile") {
      query.eq("accepts_fragile", true);
    }
  }

  if (params.isReturnTrip) {
    query.eq("is_return_trip", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 500, "trip_search_failed");
  }

  return ((data ?? []) as unknown as ListingJoinedRecord[]).map((record) =>
    toTripSearchResult(toTrip(record), 42),
  );
}

export async function listPublicTrips(limit = SEARCH_PAGE_SIZE) {
  if (!hasSupabaseEnv()) {
    return [] as Trip[];
  }

  const query = getJoinedTripsQuery();
  const { data, error } = await query
    .in("status", ["active", "booked_partial"])
    .lte("publish_at", new Date().toISOString())
    .gte("trip_date", getTodayIsoDate())
    .order("trip_date", { ascending: true })
    .limit(limit);

  if (error) {
    throw new AppError(error.message, 500, "trip_query_failed");
  }

  return ((data ?? []) as unknown as ListingJoinedRecord[]).map(toTrip);
}

export async function getTripById(id: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const query = getJoinedTripsQuery();
  const { data, error } = await query.eq("id", id).maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "trip_query_failed");
  }

  if (!data) {
    return null;
  }

  return toTrip(data as unknown as ListingJoinedRecord);
}

async function geocodeSearchInput(input: TripSearchInput) {
  if (!hasMapsEnv()) {
    return null;
  }

  const [from, to] = await Promise.all([
    geocodeAddress(`${input.from}, Sydney NSW, Australia`),
    geocodeAddress(`${input.to}, Sydney NSW, Australia`),
  ]);

  if (!from[0] || !to[0]) {
    return null;
  }

  return {
    pickupLat: from[0].location.lat,
    pickupLng: from[0].location.lng,
    dropoffLat: to[0].location.lat,
    dropoffLng: to[0].location.lng,
  };
}

async function cachedTextSearch(
  from: string,
  to: string,
  when?: string,
  what?: string,
  isReturnTrip?: boolean,
) {
  return unstable_cache(
    async () => {
    if (!hasSupabaseEnv()) {
      return [] as TripSearchResult[];
    }

    const query = getJoinedTripsQuery()
      .in("status", ["active", "booked_partial"])
      .lte("publish_at", new Date().toISOString())
      .ilike("origin_suburb", `%${from}%`)
      .ilike("destination_suburb", `%${to}%`)
      .order("trip_date", { ascending: true })
      .limit(SEARCH_PAGE_SIZE);

    if (when) {
      query.eq("trip_date", when);
    }

    if (what === "furniture") {
      query.eq("accepts_furniture", true);
    }

    if (what === "boxes") {
      query.eq("accepts_boxes", true);
    }

    if (what === "appliance") {
      query.eq("accepts_appliances", true);
    }

    if (what === "fragile") {
      query.eq("accepts_fragile", true);
    }

    if (isReturnTrip) {
      query.eq("is_return_trip", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(error.message, 500, "trip_search_failed");
    }

    return ((data ?? []) as unknown as ListingJoinedRecord[])
      .map((record) => toTripSearchResult(toTrip(record), 50));
  },
    [
      "trip-text-search",
      from,
      to,
      when ?? "any",
      what ?? "any",
      isReturnTrip ? "return" : "standard",
    ],
    { revalidate: SEARCH_REVALIDATE_SECONDS },
  )();
}

export async function searchTrips(input: TripSearchInput) {
  if (!hasSupabaseEnv()) {
    return {
      results: [] as TripSearchResult[],
      geocodingAvailable: false,
      fallbackUsed: false,
      fallbackReason: "supabase_unavailable",
      nearbyDateOptions: [],
    } satisfies TripSearchResponse;
  }

  const geocoded = await geocodeSearchInput(input);
  const nearbyDates = input.when
    ? [-3, -2, -1, 1, 2, 3].map((offset) => getDateOffsetIso(input.when!, offset))
    : [];

  if (!geocoded) {
    const results = await cachedTextSearch(
      input.from,
      input.to,
      input.when,
      input.what,
      input.isReturnTrip,
    );
    const fallbackResults =
      results.length === 0 && input.when && input.includeNearbyDates !== false
        ? await queryTripsByDateWindow({
            from: input.from,
            to: input.to,
            what: input.what,
            isReturnTrip: input.isReturnTrip,
            dates: nearbyDates,
          })
        : [];

    return {
      results: results.length > 0 ? results : fallbackResults,
      geocodingAvailable: false,
      fallbackUsed: results.length === 0 && fallbackResults.length > 0,
      fallbackReason: results.length === 0 && fallbackResults.length > 0 ? "nearby_dates" : "geocoding_unavailable",
      nearbyDateOptions:
        results.length === 0 && fallbackResults.length > 0
          ? Array.from(new Set(fallbackResults.map((trip) => trip.tripDate)))
          : [],
    } satisfies TripSearchResponse;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("find_matching_listings", {
    p_pickup_lat: geocoded.pickupLat,
    p_pickup_lng: geocoded.pickupLng,
    p_dropoff_lat: geocoded.dropoffLat,
    p_dropoff_lng: geocoded.dropoffLng,
    p_date: input.when ?? null,
    p_category: input.what ?? null,
    p_limit: SEARCH_PAGE_SIZE,
  });

  if (error) {
    throw new AppError(error.message, 500, "trip_search_failed");
  }

  const matches = (data ?? []) as unknown as SearchRpcRow[];
  const trips = await queryTripsByIds(matches.map((match) => match.listing_id));
  const tripMap = new Map(trips.map((trip) => [trip.id, trip]));
  const exactMatches = matches
    .map((match) => {
      const trip = tripMap.get(match.listing_id);

      if (!trip) {
        return null;
      }

      const routeFit = Math.max(0, 35 - match.pickup_distance_km * 2);
      const destinationFit = Math.max(0, 35 - match.dropoff_distance_km * 2);
      const reliability = Math.max(0, (trip.carrier.averageRating / 5) * 20);
      const priceFit = Math.max(0, 10 - trip.priceCents / 4000);

      return toTripSearchResult(trip, match.match_score, {
        routeFit,
        destinationFit,
        reliability,
        priceFit,
      });
    })
    .filter((trip): trip is TripSearchResult => Boolean(trip));

  const filteredExactMatches = input.isReturnTrip
    ? exactMatches.filter((trip) => trip.isReturnTrip)
    : exactMatches;

  if (filteredExactMatches.length > 0 || !input.when || input.includeNearbyDates === false) {
    return {
      results: filteredExactMatches,
      geocodingAvailable: true,
      fallbackUsed: false,
      fallbackReason: null,
      nearbyDateOptions: [],
    } satisfies TripSearchResponse;
  }

  const fallbackResults = await queryTripsByDateWindow({
    from: input.from,
    to: input.to,
    what: input.what,
    isReturnTrip: input.isReturnTrip,
    dates: nearbyDates,
  });

  return {
    results: fallbackResults,
    geocodingAvailable: true,
    fallbackUsed: fallbackResults.length > 0,
    fallbackReason: fallbackResults.length > 0 ? "nearby_dates" : null,
    nearbyDateOptions: Array.from(new Set(fallbackResults.map((trip) => trip.tripDate))),
  } satisfies TripSearchResponse;
}

export async function listCarrierTrips(
  userId: string,
  options?: {
    activeOnly?: boolean;
  },
) {
  if (!hasSupabaseEnv()) {
    return [] as Trip[];
  }

  const supabase = createServerSupabaseClient();
  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!carrier) {
    return [] as Trip[];
  }

  const query = getJoinedTripsQuery();
  query.eq("carrier_id", carrier.id).order("trip_date", { ascending: true });

  if (options?.activeOnly) {
    query
      .in("status", ["active", "booked_partial", "draft"])
      .gte("trip_date", getDateOffsetIso(getTodayIsoDate(), -1));
  } else {
    query.gte("trip_date", getDateOffsetIso(getTodayIsoDate(), -2));
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 500, "carrier_trip_query_failed");
  }

  return ((data ?? []) as unknown as ListingJoinedRecord[]).map(toTrip);
}

export async function listPublicTripsForCarrier(carrierId: string) {
  if (!hasSupabaseEnv()) {
    return [] as Trip[];
  }

  const query = getJoinedTripsQuery();
  const { data, error } = await query
    .eq("carrier_id", carrierId)
    .in("status", ["active", "booked_partial"])
    .lte("publish_at", new Date().toISOString())
    .order("trip_date", { ascending: true });

  if (error) {
    throw new AppError(error.message, 500, "carrier_trip_query_failed");
  }

  return ((data ?? []) as unknown as ListingJoinedRecord[]).map(toTrip);
}

export async function createTripForCarrier(userId: string, input: TripInput) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = tripSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError("Trip payload is invalid.", 400, "invalid_trip");
  }

  const supabase = createServerSupabaseClient();
  const { data: carrier, error: carrierError } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_lookup_failed");
  }

  if (!carrier) {
    throw new AppError(
      "Complete carrier onboarding before posting a trip.",
      400,
      "carrier_missing",
    );
  }

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("carrier_id", carrier.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (vehicleError) {
    throw new AppError(vehicleError.message, 500, "vehicle_lookup_failed");
  }

  if (!vehicle) {
    throw new AppError(
      "Add an active vehicle before posting a trip.",
      400,
      "vehicle_missing",
    );
  }

  const insertPayload = {
    carrier_id: carrier.id,
    vehicle_id: vehicle.id,
    origin_suburb: parsed.data.originSuburb,
    origin_postcode: parsed.data.originPostcode,
    origin_point: toGeographyPoint(
      parsed.data.originLongitude,
      parsed.data.originLatitude,
    ),
    destination_suburb: parsed.data.destinationSuburb,
    destination_postcode: parsed.data.destinationPostcode,
    destination_point: toGeographyPoint(
      parsed.data.destinationLongitude,
      parsed.data.destinationLatitude,
    ),
    detour_radius_km: parsed.data.detourRadiusKm,
    trip_date: parsed.data.tripDate,
    time_window: parsed.data.timeWindow,
    space_size: parsed.data.spaceSize,
    available_weight_kg: parsed.data.availableWeightKg,
    available_volume_m3: parsed.data.availableVolumeM3,
    price_cents: parsed.data.priceCents,
    suggested_price_cents: parsed.data.suggestedPriceCents ?? null,
    accepts_furniture: parsed.data.accepts.includes("furniture"),
    accepts_boxes: parsed.data.accepts.includes("boxes"),
    accepts_appliances: parsed.data.accepts.includes("appliance"),
    accepts_fragile: parsed.data.accepts.includes("fragile"),
    stairs_ok: parsed.data.stairsOk,
    stairs_extra_cents: parsed.data.stairsExtraCents,
    helper_available: parsed.data.helperAvailable,
    helper_extra_cents: parsed.data.helperExtraCents,
    special_notes: parsed.data.specialNotes ?? null,
    is_return_trip: parsed.data.isReturnTrip,
    status: parsed.data.status,
    publish_at: parsed.data.publishAt ?? null,
  };

  const { data, error } = await supabase
    .from("capacity_listings")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "trip_create_failed");
  }

  return getTripById(data.id);
}

export async function cancelTripForCarrier(userId: string, tripId: string) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const supabase = createServerSupabaseClient();
  const { data: carrier, error: carrierError } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_lookup_failed");
  }

  if (!carrier) {
    throw new AppError("Carrier profile not found.", 404, "carrier_not_found");
  }

  const { data: ownedTrip, error: tripLookupError } = await supabase
    .from("capacity_listings")
    .select("id")
    .eq("id", tripId)
    .eq("carrier_id", carrier.id)
    .maybeSingle();

  if (tripLookupError) {
    throw new AppError(tripLookupError.message, 500, "trip_lookup_failed");
  }

  if (!ownedTrip) {
    throw new AppError("Trip not found.", 404, "trip_not_found");
  }

  const { error } = await supabase
    .from("capacity_listings")
    .update({ status: "cancelled" })
    .eq("id", tripId);

  if (error) {
    throw new AppError(error.message, 500, "trip_cancel_failed");
  }

  return true;
}

export async function updateTripForCarrier(
  userId: string,
  tripId: string,
  input: TripUpdateInput,
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = tripUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError("Trip update payload is invalid.", 400, "invalid_trip_update");
  }

  const supabase = createServerSupabaseClient();
  const { data: carrier, error: carrierError } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_lookup_failed");
  }

  if (!carrier) {
    throw new AppError("Carrier profile not found.", 404, "carrier_not_found");
  }

  const { data: existingTrip, error: tripError } = await supabase
    .from("capacity_listings")
    .select("id")
    .eq("id", tripId)
    .eq("carrier_id", carrier.id)
    .maybeSingle();

  if (tripError) {
    throw new AppError(tripError.message, 500, "trip_lookup_failed");
  }

  if (!existingTrip) {
    throw new AppError("Trip not found.", 404, "trip_not_found");
  }

  const { error: updateError } = await supabase
    .from("capacity_listings")
    .update({
      trip_date: parsed.data.tripDate,
      time_window: parsed.data.timeWindow,
      space_size: parsed.data.spaceSize,
      available_volume_m3: parsed.data.availableVolumeM3,
      available_weight_kg: parsed.data.availableWeightKg,
      detour_radius_km: parsed.data.detourRadiusKm,
      price_cents: parsed.data.priceCents,
      accepts_furniture: parsed.data.accepts.includes("furniture"),
      accepts_boxes: parsed.data.accepts.includes("boxes"),
      accepts_appliances: parsed.data.accepts.includes("appliance"),
      accepts_fragile: parsed.data.accepts.includes("fragile"),
      stairs_ok: parsed.data.stairsOk,
      stairs_extra_cents: parsed.data.stairsExtraCents,
      helper_available: parsed.data.helperAvailable,
      helper_extra_cents: parsed.data.helperExtraCents,
      is_return_trip: parsed.data.isReturnTrip,
      status: parsed.data.status,
      publish_at: parsed.data.publishAt ?? null,
      special_notes: parsed.data.specialNotes?.trim() ? parsed.data.specialNotes.trim() : null,
    })
    .eq("id", tripId)
    .eq("carrier_id", carrier.id);

  if (updateError) {
    throw new AppError(updateError.message, 500, "trip_update_failed");
  }

  return getTripById(tripId);
}
