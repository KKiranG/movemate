import { unstable_cache } from "next/cache";

import { isCarrierActivationLive } from "@/lib/carrier-activation";
import { SEARCH_PAGE_SIZE, SEARCH_REVALIDATE_SECONDS } from "@/lib/constants";
import { buildBookingEmail } from "@/lib/email";
import { hasMapsEnv, hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getListingStatusFromCapacity } from "@/lib/booking-capacity";
import { getDistanceKmBetweenPoints } from "@/lib/maps/haversine";
import { getSydneySuburbCoords } from "@/lib/maps/sydney-suburb-coords";
import { geocodeAddress } from "@/lib/maps/geocode";
import { getMinimumTripBasePriceCents, getRouteDistanceKm } from "@/lib/pricing/guardrails";
import { sendBookingTransactionalEmail, sendTripFreshnessNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { toGeographyPoint, toTrip, toTripSearchResult, type ListingJoinedRecord } from "@/lib/data/mappers";
import {
  ensureOperatorTask,
  listOperatorTasks,
  recordAdminActionEvent,
  updateOperatorTask,
} from "@/lib/data/operator-tasks";
import { tripSchema, tripUpdateSchema, type TripInput, type TripUpdateInput } from "@/lib/validation/trip";
import { getDateOffsetIso, getTodayIsoDate } from "@/lib/utils";
import type { Trip, TripSearchInput, TripSearchResponse, TripSearchResult } from "@/types/trip";

type SearchRpcRow = {
  listing_id: string;
  match_score: number;
  pickup_distance_km: number;
  dropoff_distance_km: number;
  total_count?: number;
};

function getEffectiveMinimumBasePriceCents(params: {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  minimumBasePriceCents?: number | null;
}) {
  const distanceKm = getRouteDistanceKm({
    originLatitude: params.originLatitude,
    originLongitude: params.originLongitude,
    destinationLatitude: params.destinationLatitude,
    destinationLongitude: params.destinationLongitude,
  });

  return Math.max(
    params.minimumBasePriceCents ?? 0,
    getMinimumTripBasePriceCents(distanceKm),
  );
}

function getTripStartDateTimeIso(trip: Pick<Trip, "tripDate" | "timeWindow">) {
  const timeByWindow: Record<Trip["timeWindow"], string> = {
    morning: "09:00:00",
    afternoon: "13:00:00",
    evening: "18:00:00",
    flexible: "09:00:00",
  };

  return `${trip.tripDate}T${timeByWindow[trip.timeWindow]}.000Z`;
}

function isTripFreshnessDeprioritized(
  trip: Pick<Trip, "tripDate" | "timeWindow" | "checkin24hRequestedAt" | "checkin24hConfirmed" | "status">,
  nowIso = new Date().toISOString(),
) {
  if (trip.status === "suspended") {
    return true;
  }

  if (!trip.checkin24hRequestedAt || trip.checkin24hConfirmed) {
    return false;
  }

  const tripStart = new Date(getTripStartDateTimeIso(trip)).getTime();
  const now = new Date(nowIso).getTime();
  return tripStart - now <= 24 * 60 * 60 * 1000;
}

function sortTripsByFreshnessPriority(results: TripSearchResult[]) {
  return [...results].sort((left, right) => {
    const leftPenalty = isTripFreshnessDeprioritized(left) ? 1 : 0;
    const rightPenalty = isTripFreshnessDeprioritized(right) ? 1 : 0;

    if (leftPenalty !== rightPenalty) {
      return leftPenalty - rightPenalty;
    }

    return right.matchScore - left.matchScore;
  });
}

function isTripPubliclyMatchable(trip: Pick<Trip, "status">) {
  return trip.status !== "suspended" && trip.status !== "cancelled" && trip.status !== "expired";
}

function buildSearchBreakdown(params: {
  trip: Trip;
  pickupDistanceKm: number;
  dropoffDistanceKm: number;
  score: number;
}) {
  const routeFit = Math.max(0, 35 - params.pickupDistanceKm * 2);
  const destinationFit = Math.max(0, 35 - params.dropoffDistanceKm * 2);
  const reliability = Math.max(0, (params.trip.carrier.averageRating / 5) * 20);
  const priceFit = Math.max(0, 10 - params.trip.priceCents / 4000);

  return {
    routeFit,
    destinationFit,
    reliability,
    priceFit,
    pickupDistanceKm: Number(params.pickupDistanceKm.toFixed(1)),
    dropoffDistanceKm: Number(params.dropoffDistanceKm.toFixed(1)),
  };
}

function getDateWindow(input: TripSearchInput) {
  if (input.dates && input.dates.length > 0) {
    return Array.from(new Set(input.dates)).sort();
  }

  if (input.when) {
    return [input.when];
  }

  return [];
}

async function getCarrierAndActiveVehicles(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data: carrier, error: carrierError } = await supabase
    .from("carriers")
    .select("id, activation_status, verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_lookup_failed");
  }

  if (!carrier) {
    return { carrier: null, vehicles: [] as Array<{ id: string }> };
  }

  const { data: vehicles, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("carrier_id", carrier.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (vehicleError) {
    throw new AppError(vehicleError.message, 500, "vehicle_lookup_failed");
  }

  return {
    carrier,
    vehicles: vehicles ?? [],
  };
}

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
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  what?: string;
  isReturnTrip?: boolean;
  dates: string[];
  page: number;
}) {
  if (!hasSupabaseEnv() || params.dates.length === 0) {
    return {
      results: [] as TripSearchResult[],
      totalCount: 0,
    };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("find_matching_listings_nearby_dates", {
    p_pickup_lat: params.pickupLat,
    p_pickup_lng: params.pickupLng,
    p_dropoff_lat: params.dropoffLat,
    p_dropoff_lng: params.dropoffLng,
    p_dates: params.dates,
    p_category: params.what ?? null,
    p_is_return_trip: params.isReturnTrip ?? false,
    p_page: 1,
    p_page_size: SEARCH_PAGE_SIZE * params.page,
  });

  if (error) {
    throw new AppError(error.message, 500, "trip_search_failed");
  }

  const matches = (data ?? []) as unknown as SearchRpcRow[];
  const trips = await queryTripsByIds(matches.map((match) => match.listing_id));
  const tripMap = new Map(trips.map((trip) => [trip.id, trip]));
  return {
    results: sortTripsByFreshnessPriority(matches
      .map((match) => {
        const trip = tripMap.get(match.listing_id);

        if (!trip) {
          return null;
        }

        return toTripSearchResult(
          trip,
          match.match_score,
          buildSearchBreakdown({
            trip,
            pickupDistanceKm: match.pickup_distance_km,
            dropoffDistanceKm: match.dropoff_distance_km,
            score: match.match_score,
          }),
        );
      })
      .filter((trip): trip is TripSearchResult => Boolean(trip))),
    totalCount: Number(matches[0]?.total_count ?? 0),
  };
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
    geocodeAddress(`${input.from}, Australia`),
    geocodeAddress(`${input.to}, Australia`),
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

async function cachedSuburbCoordinateSearch(
  from: string,
  to: string,
  dates: string[],
  what?: string,
  isReturnTrip?: boolean,
  page = 1,
) {
  return unstable_cache(
    async () => {
      if (!hasSupabaseEnv()) {
        return {
          results: [] as TripSearchResult[],
          totalCount: 0,
        };
      }

      const pickupCoords = getSydneySuburbCoords(from);
      const dropoffCoords = getSydneySuburbCoords(to);

      if (!pickupCoords || !dropoffCoords) {
        return {
          results: [] as TripSearchResult[],
          totalCount: 0,
        };
      }

      const supabase = createServerSupabaseClient();
      const query = supabase
        .from("capacity_listings")
        .select("*, carrier:carriers(*), vehicle:vehicles(*)")
        .in("status", ["active", "booked_partial"])
        .lte("publish_at", new Date().toISOString())
        .gte("trip_date", getTodayIsoDate())
        .order("trip_date", { ascending: true });

      if (dates.length > 0) {
        query.in("trip_date", dates);
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

      const matches = ((data ?? []) as unknown as ListingJoinedRecord[])
        .map((record) => toTrip(record))
        .map((trip) => {
          if (!isTripPubliclyMatchable(trip)) {
            return null;
          }

          if (
            trip.route.originLatitude === undefined ||
            trip.route.originLongitude === undefined ||
            trip.route.destinationLatitude === undefined ||
            trip.route.destinationLongitude === undefined
          ) {
            return null;
          }

          const pickupDistanceKm = getDistanceKmBetweenPoints(pickupCoords, {
            lat: trip.route.originLatitude,
            lng: trip.route.originLongitude,
          });
          const dropoffDistanceKm = getDistanceKmBetweenPoints(dropoffCoords, {
            lat: trip.route.destinationLatitude,
            lng: trip.route.destinationLongitude,
          });
          const withinPickupRadius = pickupDistanceKm <= trip.detourRadiusKm;
          const withinDropoffRadius = dropoffDistanceKm <= trip.detourRadiusKm;

          if (!withinPickupRadius || !withinDropoffRadius) {
            return null;
          }

          const score = Math.max(
            0,
            Math.round(
              100 -
                pickupDistanceKm * 3 -
                dropoffDistanceKm * 3 +
                (trip.carrier.averageRating / 5) * 8,
            ),
          );

          return toTripSearchResult(
            trip,
            score,
            buildSearchBreakdown({
              trip,
              pickupDistanceKm,
              dropoffDistanceKm,
              score,
            }),
          );
        })
        .filter((trip): trip is TripSearchResult => Boolean(trip))
        .sort((left, right) => {
          const leftDistance =
            (left.breakdown.pickupDistanceKm ?? Number.POSITIVE_INFINITY) +
            (left.breakdown.dropoffDistanceKm ?? Number.POSITIVE_INFINITY);
          const rightDistance =
            (right.breakdown.pickupDistanceKm ?? Number.POSITIVE_INFINITY) +
            (right.breakdown.dropoffDistanceKm ?? Number.POSITIVE_INFINITY);

          return (
            left.tripDate.localeCompare(right.tripDate) ||
            right.matchScore - left.matchScore ||
            leftDistance - rightDistance ||
            left.id.localeCompare(right.id)
          );
        });

      return {
        results: matches.slice(0, page * SEARCH_PAGE_SIZE),
        totalCount: matches.length,
      };
    },
    [
      "trip-suburb-coordinate-search",
      from,
      to,
      dates.join(",") || "any",
      what ?? "any",
      isReturnTrip ? "return" : "standard",
      String(page),
    ],
    { revalidate: SEARCH_REVALIDATE_SECONDS },
  )();
}

export async function searchTrips(input: TripSearchInput) {
  const page = Math.max(1, input.page ?? 1);
  const activeDates = getDateWindow(input);
  const mapsConfigured = hasMapsEnv();

  if (!hasSupabaseEnv()) {
    return {
      results: [] as TripSearchResult[],
      totalCount: 0,
      visibleCount: 0,
      page,
      hasMore: false,
      geocodingAvailable: false,
      fallbackUsed: false,
      fallbackReason: "supabase_unavailable",
      nearbyDateOptions: [],
    } satisfies TripSearchResponse;
  }

  const geocoded = await geocodeSearchInput(input);
  const nearbyDates = input.when
    ? [-3, -2, -1, 1, 2, 3]
        .map((offset) => getDateOffsetIso(input.when!, offset))
        .filter((date) => date >= getTodayIsoDate())
    : [];

  const isFlexibleSearch = activeDates.length > 1;

  if (!geocoded) {
    if (mapsConfigured) {
      return {
        results: [] as TripSearchResult[],
        totalCount: 0,
        visibleCount: 0,
        page,
        hasMore: false,
        geocodingAvailable: true,
        fallbackUsed: false,
        fallbackReason: "geocoding_failed",
        nearbyDateOptions: [],
      } satisfies TripSearchResponse;
    }

    const exact = await cachedSuburbCoordinateSearch(
      input.from,
      input.to,
      activeDates,
      input.what,
      input.isReturnTrip,
      page,
    );
    const fallbackResults =
      exact.results.length === 0 &&
      input.when &&
      input.includeNearbyDates !== false &&
      !isFlexibleSearch
        ? { results: [] as TripSearchResult[], totalCount: 0 }
        : { results: [] as TripSearchResult[], totalCount: 0 };
    const activeResults = exact.results.length > 0 ? exact : fallbackResults;

    return {
      results: activeResults.results,
      totalCount: activeResults.totalCount,
      visibleCount: activeResults.results.length,
      page,
      hasMore: page * SEARCH_PAGE_SIZE < activeResults.totalCount,
      geocodingAvailable: false,
      fallbackUsed: exact.results.length === 0 && fallbackResults.results.length > 0,
      fallbackReason:
        exact.results.length === 0 && fallbackResults.results.length > 0
          ? "nearby_dates"
          : "suburb_coordinate_fallback",
      nearbyDateOptions:
        exact.results.length === 0 && fallbackResults.results.length > 0
          ? Array.from(new Set(fallbackResults.results.map((trip) => trip.tripDate)))
          : [],
    } satisfies TripSearchResponse;
  }

  if (isFlexibleSearch) {
    const flexibleResults = await queryTripsByDateWindow({
      pickupLat: geocoded.pickupLat,
      pickupLng: geocoded.pickupLng,
      dropoffLat: geocoded.dropoffLat,
      dropoffLng: geocoded.dropoffLng,
      what: input.what,
      isReturnTrip: input.isReturnTrip,
      dates: activeDates,
      page,
    });

    return {
      results: flexibleResults.results,
      totalCount: flexibleResults.totalCount,
      visibleCount: flexibleResults.results.length,
      page,
      hasMore: page * SEARCH_PAGE_SIZE < flexibleResults.totalCount,
      geocodingAvailable: true,
      fallbackUsed: false,
      fallbackReason: null,
      nearbyDateOptions: Array.from(new Set(flexibleResults.results.map((trip) => trip.tripDate))),
    } satisfies TripSearchResponse;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("find_matching_listings_paged", {
    p_pickup_lat: geocoded.pickupLat,
    p_pickup_lng: geocoded.pickupLng,
    p_dropoff_lat: geocoded.dropoffLat,
    p_dropoff_lng: geocoded.dropoffLng,
    p_date: input.when ?? null,
    p_category: input.what ?? null,
    p_page: 1,
    p_page_size: SEARCH_PAGE_SIZE * page,
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

      if (!isTripPubliclyMatchable(trip)) {
        return null;
      }

      return toTripSearchResult(
        trip,
        match.match_score,
        buildSearchBreakdown({
          trip,
          pickupDistanceKm: match.pickup_distance_km,
          dropoffDistanceKm: match.dropoff_distance_km,
          score: match.match_score,
        }),
      );
    })
    .filter((trip): trip is TripSearchResult => Boolean(trip));

  const filteredExactMatches = input.isReturnTrip
    ? exactMatches.filter((trip) => trip.isReturnTrip)
    : exactMatches;
  const totalCount = Number(matches[0]?.total_count ?? filteredExactMatches.length);

  if (filteredExactMatches.length > 0 || !input.when || input.includeNearbyDates === false) {
    return {
      results: filteredExactMatches,
      totalCount,
      visibleCount: filteredExactMatches.length,
      page,
      hasMore: page * SEARCH_PAGE_SIZE < totalCount,
      geocodingAvailable: true,
      fallbackUsed: false,
      fallbackReason: null,
      nearbyDateOptions: [],
    } satisfies TripSearchResponse;
  }

  const fallbackResults = await queryTripsByDateWindow({
    pickupLat: geocoded.pickupLat,
    pickupLng: geocoded.pickupLng,
    dropoffLat: geocoded.dropoffLat,
    dropoffLng: geocoded.dropoffLng,
    what: input.what,
    isReturnTrip: input.isReturnTrip,
    dates: nearbyDates,
    page,
  });

  return {
    results: fallbackResults.results,
    totalCount: fallbackResults.totalCount,
    visibleCount: fallbackResults.results.length,
    page,
    hasMore: page * SEARCH_PAGE_SIZE < fallbackResults.totalCount,
    geocodingAvailable: true,
    fallbackUsed: fallbackResults.results.length > 0,
    fallbackReason: fallbackResults.results.length > 0 ? "nearby_dates" : null,
    nearbyDateOptions: Array.from(new Set(fallbackResults.results.map((trip) => trip.tripDate))),
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
    query
      .in("status", ["active", "booked_partial", "draft", "paused", "cancelled", "expired"])
      .gte("trip_date", getDateOffsetIso(getTodayIsoDate(), -2));
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
  const { carrier, vehicles } = await getCarrierAndActiveVehicles(userId);

  if (!carrier) {
    throw new AppError(
      "Complete carrier onboarding before posting a trip.",
      400,
      "carrier_missing",
    );
  }

  if (vehicles.length === 0) {
    throw new AppError(
      "Add an active vehicle before posting a trip.",
      400,
      "vehicle_missing",
    );
  }

  const vehicle =
    vehicles.find((entry) => entry.id === parsed.data.vehicleId) ??
    (vehicles.length === 1 ? vehicles[0] : null);

  if (!vehicle) {
    throw new AppError(
      "Choose which vehicle is running this trip before publishing.",
      400,
      "vehicle_selection_required",
    );
  }

  const carrierActivationStatus =
    carrier.activation_status ??
    (carrier.verification_status === "verified"
      ? "active"
      : carrier.verification_status === "submitted"
        ? "pending_review"
        : carrier.verification_status === "rejected"
          ? "rejected"
          : "activation_started");

  if (parsed.data.status === "active" && !isCarrierActivationLive(carrierActivationStatus)) {
    throw new AppError(
      "Finish activation before publishing live supply. Save this route as draft until ops approval is complete.",
      409,
      "carrier_not_active",
    );
  }

  const minimumBasePriceCents = getEffectiveMinimumBasePriceCents({
    originLatitude: parsed.data.originLatitude,
    originLongitude: parsed.data.originLongitude,
    destinationLatitude: parsed.data.destinationLatitude,
    destinationLongitude: parsed.data.destinationLongitude,
    minimumBasePriceCents: parsed.data.minimumBasePriceCents,
  });

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
    waypoint_suburbs: parsed.data.waypointSuburbs,
    route_polyline: parsed.data.routePolyline ?? null,
    recurrence_rule: parsed.data.recurrenceRule?.trim() || null,
    recurrence_days: parsed.data.recurrenceDays,
    detour_tolerance_label: parsed.data.detourToleranceLabel,
    detour_radius_km: parsed.data.detourRadiusKm,
    trip_date: parsed.data.tripDate,
    time_window: parsed.data.timeWindow,
    space_size: parsed.data.spaceSize,
    available_weight_kg: parsed.data.availableWeightKg,
    available_volume_m3: parsed.data.availableVolumeM3,
    price_cents: parsed.data.priceCents,
    minimum_base_price_cents: minimumBasePriceCents,
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
    checkin_24h_confirmed: false,
    checkin_24h_requested_at: null,
    checkin_2h_confirmed: false,
    checkin_2h_requested_at: null,
    freshness_suspended_at: null,
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
  const { carrier, vehicles } = await getCarrierAndActiveVehicles(userId);

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

  const currentTrip = await getTripById(tripId);

  let minimumBasePriceCents =
    parsed.data.minimumBasePriceCents ?? currentTrip?.minimumBasePriceCents ?? 0;

  if (
    currentTrip?.route.originLatitude !== undefined &&
    currentTrip.route.originLongitude !== undefined &&
    currentTrip.route.destinationLatitude !== undefined &&
    currentTrip.route.destinationLongitude !== undefined
  ) {
    minimumBasePriceCents = getEffectiveMinimumBasePriceCents({
      originLatitude: currentTrip.route.originLatitude,
      originLongitude: currentTrip.route.originLongitude,
      destinationLatitude: currentTrip.route.destinationLatitude,
      destinationLongitude: currentTrip.route.destinationLongitude,
      minimumBasePriceCents,
    });

    if (parsed.data.priceCents < minimumBasePriceCents) {
      throw new AppError(
        `Trips on this corridor need to be at least $${(minimumBasePriceCents / 100).toFixed(0)}.`,
        400,
        "trip_price_below_floor",
      );
    }
  }

  const selectedVehicle =
    parsed.data.vehicleId === undefined
      ? undefined
      : vehicles.find((entry) => entry.id === parsed.data.vehicleId);

  if (parsed.data.vehicleId && !selectedVehicle) {
    throw new AppError("Choose one of your active vehicles for this trip.", 400, "vehicle_invalid");
  }

  const { error: updateError } = await supabase
    .from("capacity_listings")
    .update({
      vehicle_id: selectedVehicle?.id,
      waypoint_suburbs: parsed.data.waypointSuburbs,
      route_polyline: parsed.data.routePolyline?.trim() || null,
      recurrence_rule: parsed.data.recurrenceRule?.trim() || null,
      recurrence_days: parsed.data.recurrenceDays,
      trip_date: parsed.data.tripDate,
      time_window: parsed.data.timeWindow,
      space_size: parsed.data.spaceSize,
      available_volume_m3: parsed.data.availableVolumeM3,
      available_weight_kg: parsed.data.availableWeightKg,
      detour_tolerance_label: parsed.data.detourToleranceLabel,
      detour_radius_km: parsed.data.detourRadiusKm,
      price_cents: parsed.data.priceCents,
      minimum_base_price_cents: minimumBasePriceCents,
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
      checkin_24h_confirmed: false,
      checkin_24h_requested_at: null,
      checkin_2h_confirmed: false,
      checkin_2h_requested_at: null,
      freshness_suspended_at: null,
    })
    .eq("id", tripId)
    .eq("carrier_id", carrier.id);

  if (updateError) {
    throw new AppError(updateError.message, 500, "trip_update_failed");
  }

  return getTripById(tripId);
}

async function notifyCustomersAboutSuspendedTrip(params: {
  listingId: string;
  routeLabel: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_reference, total_price_cents, pickup_suburb, dropoff_suburb, customers!inner(email)")
    .eq("listing_id", params.listingId)
    .in("status", ["pending", "confirmed", "picked_up"]);

  if (error || !data) {
    return {
      affectedBookingCount: 0,
    };
  }

  await Promise.all(
    data.map((row) =>
      sendBookingTransactionalEmail({
        bookingId: row.id,
        bookingStatus: null,
        emailType: "trip_freshness_suspended",
        to: ((row.customers as { email?: string } | null)?.email ?? "").trim(),
        subject: `Trip needs reconfirmation: ${row.booking_reference}`,
        html: buildBookingEmail({
          eyebrow: "Trip freshness",
          title: "This route needs carrier reconfirmation",
          intro:
            "The carrier has not confirmed that the trip is still running inside the required freshness window, so MoveMate temporarily suspended the route while ops reviews it.",
          bookingReference: row.booking_reference,
          routeLabel: params.routeLabel,
          priceLabel: new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
            maximumFractionDigits: 0,
          }).format(row.total_price_cents / 100),
          ctaPath: `/bookings/${row.id}`,
          ctaLabel: "Open booking",
          bodyLines: [
            "Do not move coordination off-platform while this route is being rechecked.",
            "MoveMate will keep the booking record updated if the route is reconfirmed or a recovery path is needed.",
          ],
        }),
      }),
    ),
  );

  return {
    affectedBookingCount: data.length,
  };
}

export async function confirmTripFreshnessCheckinForCarrier(params: {
  userId: string;
  tripId: string;
  window: "24h" | "2h";
}) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const supabase = createServerSupabaseClient();
  const { data: carrier, error: carrierError } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_lookup_failed");
  }

  if (!carrier) {
    throw new AppError("Carrier profile not found.", 404, "carrier_not_found");
  }

  const patch =
    params.window === "24h"
      ? {
          checkin_24h_confirmed: true,
          freshness_last_action: "confirmed_24h" as const,
          last_freshness_confirmed_at: new Date().toISOString(),
        }
      : {
          checkin_2h_confirmed: true,
          status: "active" as const,
          freshness_suspended_at: null,
          freshness_suspension_reason: null,
          freshness_last_action: "confirmed_2h" as const,
          last_freshness_confirmed_at: new Date().toISOString(),
        };

  const { error } = await supabase
    .from("capacity_listings")
    .update(patch)
    .eq("id", params.tripId)
    .eq("carrier_id", carrier.id);

  if (error) {
    throw new AppError(error.message, 500, "trip_freshness_confirm_failed");
  }
}

export async function unsuspendTripForAdmin(params: {
  adminUserId: string;
  tripId: string;
  reason: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const reason = params.reason.trim();

  if (reason.length < 12) {
    throw new AppError(
      "Add a short ops reason before unsuspending this trip.",
      400,
      "trip_unsuspend_reason_required",
    );
  }

  const supabase = createAdminClient();
  const { data: tripRow, error: tripError } = await supabase
    .from("capacity_listings")
    .select("id, carrier_id, origin_suburb, destination_suburb, remaining_capacity_pct, status")
    .eq("id", params.tripId)
    .maybeSingle();

  if (tripError) {
    throw new AppError(tripError.message, 500, "trip_lookup_failed");
  }

  if (!tripRow) {
    throw new AppError("Trip not found.", 404, "trip_not_found");
  }

  if (tripRow.status !== "suspended") {
    throw new AppError("Only suspended trips can be unsuspended.", 409, "trip_not_suspended");
  }

  const { count: activeBookingCount, error: bookingError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", params.tripId)
    .neq("status", "cancelled");

  if (bookingError) {
    throw new AppError(bookingError.message, 500, "trip_unsuspend_booking_count_failed");
  }

  const nextStatus = getListingStatusFromCapacity(
    activeBookingCount ?? 0,
    Number(tripRow.remaining_capacity_pct ?? 100),
  );
  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("capacity_listings")
    .update({
      status: nextStatus,
      checkin_2h_confirmed: true,
      freshness_suspended_at: null,
      freshness_suspension_reason: null,
      freshness_last_action: "unsuspended",
      last_freshness_unsuspended_at: nowIso,
      last_freshness_confirmed_at: nowIso,
    })
    .eq("id", params.tripId);

  if (updateError) {
    throw new AppError(updateError.message, 500, "trip_unsuspend_failed");
  }

  const staleTasks = await listOperatorTasks({
    status: "open",
    taskType: "stale_trip_followup",
    limit: 50,
  });
  const matchingTask = staleTasks.find((task) => task.listingId === params.tripId);

  if (matchingTask) {
    await updateOperatorTask({
      taskId: matchingTask.id,
      status: "resolved",
      blocker: "Trip was manually reconfirmed and unsuspended.",
      nextAction: "Monitor the route for any further freshness misses.",
      assignedAdminUserId: null,
    });
  }

  await recordAdminActionEvent({
    adminUserId: params.adminUserId,
    entityType: "listing",
    entityId: params.tripId,
    actionType: "trip_unsuspended",
    reason,
    metadata: {
      routeLabel: `${tripRow.origin_suburb} to ${tripRow.destination_suburb}`,
      nextStatus,
      carrierId: tripRow.carrier_id,
    },
  });
}

export async function runTripFreshnessChecks(params?: {
  now?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return {
      checkinsRequested24h: 0,
      checkinsRequested2h: 0,
      deprioritizedTripIds: [] as string[],
      suspendedTripIds: [] as string[],
    };
  }

  const nowIso = params?.now ?? new Date().toISOString();
  const now = new Date(nowIso);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("capacity_listings")
    .select("id, carrier_id, origin_suburb, destination_suburb, trip_date, time_window, status, checkin_24h_confirmed, checkin_24h_requested_at, checkin_2h_confirmed, checkin_2h_requested_at, freshness_miss_count, carriers!inner(email)")
    .in("status", ["active", "booked_partial"]);

  if (error) {
    throw new AppError(error.message, 500, "trip_freshness_query_failed");
  }

  let checkinsRequested24h = 0;
  let checkinsRequested2h = 0;
  const deprioritizedTripIds: string[] = [];
  const suspendedTripIds: string[] = [];

  for (const row of data ?? []) {
    const routeLabel = `${row.origin_suburb} to ${row.destination_suburb}`;
    const tripStart = new Date(getTripStartDateTimeIso({
      tripDate: row.trip_date,
      timeWindow: row.time_window,
    }));
    const msUntilTrip = tripStart.getTime() - now.getTime();
    const carrierEmail = ((row.carriers as { email?: string } | null)?.email ?? "").trim();

    if (msUntilTrip <= 24 * 60 * 60 * 1000 && msUntilTrip > 2 * 60 * 60 * 1000) {
      deprioritizedTripIds.push(row.id);

      if (!row.checkin_24h_requested_at) {
        await supabase
          .from("capacity_listings")
          .update({
            checkin_24h_requested_at: nowIso,
            checkin_24h_confirmed: false,
            freshness_last_action: "requested_24h",
          })
          .eq("id", row.id);

        if (carrierEmail) {
          await sendTripFreshnessNotification({
            to: carrierEmail,
            subject: `Confirm tomorrow's trip: ${routeLabel}`,
            title: "Please confirm tomorrow's trip still has space",
            intro:
              "This route is inside the 24-hour freshness window. Confirm it so MoveMate can keep matching it normally.",
            routeLabel,
            ctaPath: `/carrier/trips/${row.id}/freshness-confirm?window=24h`,
            ctaLabel: "Confirm tomorrow's trip",
          });
        }

        checkinsRequested24h += 1;
      }
    }

    if (msUntilTrip <= 2 * 60 * 60 * 1000) {
      if (!row.checkin_2h_requested_at) {
        await supabase
          .from("capacity_listings")
          .update({
            checkin_2h_requested_at: nowIso,
            checkin_2h_confirmed: false,
            freshness_last_action: "requested_2h",
          })
          .eq("id", row.id);

        if (carrierEmail) {
          await sendTripFreshnessNotification({
            to: carrierEmail,
            subject: `Confirm your trip is still on: ${routeLabel}`,
            title: "Confirm your trip is still on",
            intro:
              "This route is inside the 2-hour freshness window. Confirm now or MoveMate will suspend it until ops reviews it.",
            routeLabel,
            ctaPath: `/carrier/trips/${row.id}/freshness-confirm?window=2h`,
            ctaLabel: "Confirm trip is still on",
          });
        }

        checkinsRequested2h += 1;
      } else if (!row.checkin_2h_confirmed) {
        await supabase
          .from("capacity_listings")
          .update({
            status: "suspended",
            freshness_suspended_at: nowIso,
            freshness_last_action: "suspended",
            freshness_suspension_reason: "missed_2h_checkin",
            freshness_miss_count: Number(row.freshness_miss_count ?? 0) + 1,
          })
          .eq("id", row.id);

        suspendedTripIds.push(row.id);
        const suspensionNotification = await notifyCustomersAboutSuspendedTrip({
          listingId: row.id,
          routeLabel,
        });
        await ensureOperatorTask({
          taskType: "stale_trip_followup",
          title: `Review suspended trip: ${routeLabel}`,
          blocker:
            suspensionNotification.affectedBookingCount > 0
              ? "Customers already depend on this trip and need a reconfirmation outcome."
              : "Trip missed the 2-hour check-in and needs manual review before it can re-enter matching.",
          nextAction:
            suspensionNotification.affectedBookingCount > 0
              ? "Contact the carrier, reconfirm whether the trip is still running, and either unsuspend it or move affected customers into recovery."
              : "Contact the carrier and decide whether to unsuspend or leave the route suspended.",
          priority:
            suspensionNotification.affectedBookingCount > 0 ? "urgent" : "high",
          listingId: row.id,
          carrierId: row.carrier_id,
          dueAt: nowIso,
          metadata: {
            routeLabel,
            freshnessMissCount: Number(row.freshness_miss_count ?? 0) + 1,
            affectedBookingCount: suspensionNotification.affectedBookingCount,
            suspensionReason: "missed_2h_checkin",
          },
        });
        await recordAdminActionEvent({
          actorRole: "system",
          entityType: "listing",
          entityId: row.id,
          actionType: "trip_auto_suspended",
          reason: "Trip missed the 2-hour freshness check-in and was auto-suspended.",
          metadata: {
            routeLabel,
            carrierId: row.carrier_id,
            affectedBookingCount: suspensionNotification.affectedBookingCount,
            freshnessMissCount: Number(row.freshness_miss_count ?? 0) + 1,
          },
        });
      }
    }
  }

  return {
    checkinsRequested24h,
    checkinsRequested2h,
    deprioritizedTripIds,
    suspendedTripIds,
  };
}
