import { z } from "zod";

import { getTripById } from "@/lib/data/trips";
import { toGeographyPoint } from "@/lib/data/mappers";
import { hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getNextWeekdayDate } from "@/lib/utils";
import { getMinimumTripBasePriceCents, getRouteDistanceKm } from "@/lib/pricing/guardrails";
import type {
  CreateTripTemplateInput,
  RecurringTemplateSuggestion,
  TemplateInsight,
  TripTemplate,
} from "@/types/carrier";
import type { Database } from "@/types/database";

const timeWindowSchema = z.enum(["morning", "afternoon", "evening", "flexible"]);
const spaceSizeSchema = z.enum(["S", "M", "L", "XL"]);

const createTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  originSuburb: z.string().min(2).max(120),
  originPostcode: z.string().min(4).max(8),
  originLatitude: z.number().min(-90).max(90),
  originLongitude: z.number().min(-180).max(180),
  destinationSuburb: z.string().min(2).max(120),
  destinationPostcode: z.string().min(4).max(8),
  destinationLatitude: z.number().min(-90).max(90),
  destinationLongitude: z.number().min(-180).max(180),
  spaceSize: spaceSizeSchema,
  availableVolumeM3: z.number().min(0).max(50).nullable().optional(),
  maxWeightKg: z.number().int().min(0).max(5000).nullable().optional(),
  detourRadiusKm: z.number().int().min(0).max(50).default(5),
  suggestedPriceCents: z.number().int().min(1000).max(100000),
  minimumBasePriceCents: z.number().int().min(0).max(100000).optional(),
  stairsOk: z.boolean().default(false),
  stairsExtraCents: z.number().int().min(0).default(0),
  helperExtraCents: z.number().int().min(0).default(0),
  helperAvailable: z.boolean().default(false),
  accepts: z.array(z.string().min(1)).min(1),
  timeWindow: timeWindowSchema.default("flexible"),
  notes: z.string().max(280).optional(),
});

const templatePostSchema = z.object({
  tripDate: z.string().min(1),
  timeWindow: timeWindowSchema.optional(),
  priceCents: z.number().int().min(1000).max(100000).optional(),
  minimumBasePriceCents: z.number().int().min(0).max(100000).optional(),
});

type TripTemplateRow = Database["public"]["Tables"]["trip_templates"]["Row"];

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

function parsePoint(point: unknown) {
  if (typeof point === "string") {
    const match = point.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (match) {
      return {
        longitude: Number(match[1]),
        latitude: Number(match[2]),
      };
    }
  }

  if (
    typeof point === "object" &&
    point !== null &&
    "coordinates" in point &&
    Array.isArray((point as { coordinates: unknown[] }).coordinates)
  ) {
    const coordinates = (point as { coordinates: unknown[] }).coordinates;
    return {
      longitude: typeof coordinates[0] === "number" ? coordinates[0] : undefined,
      latitude: typeof coordinates[1] === "number" ? coordinates[1] : undefined,
    };
  }

  return {};
}

function toTripTemplate(row: TripTemplateRow): TripTemplate {
  const origin = parsePoint(row.origin_point);
  const destination = parsePoint(row.destination_point);

  return {
    id: row.id,
    carrierId: row.carrier_id,
    name: row.name,
    originSuburb: row.origin_suburb,
    originPostcode: row.origin_postcode,
    originLatitude: origin.latitude,
    originLongitude: origin.longitude,
    destinationSuburb: row.destination_suburb,
    destinationPostcode: row.destination_postcode,
    destinationLatitude: destination.latitude,
    destinationLongitude: destination.longitude,
    spaceSize: row.space_size,
    availableVolumeM3: row.available_volume_m3,
    maxWeightKg: row.max_weight_kg,
    detourRadiusKm: row.detour_radius_km,
    suggestedPriceCents: row.suggested_price_cents,
    minimumBasePriceCents: row.minimum_base_price_cents,
    stairsOk: row.stairs_ok,
    stairsExtraCents: row.stairs_extra_cents,
    helperExtraCents: row.helper_extra_cents,
    helperAvailable: row.helper_available,
    handlingPolicy: row.handling_policy ?? "solo_only",
    stairsLowCents: row.stairs_low_cents ?? 0,
    stairsMediumCents: row.stairs_medium_cents ?? 0,
    stairsHighCents: row.stairs_high_cents ?? 0,
    secondMoverExtraCents: row.second_mover_extra_cents ?? 0,
    accepts: row.accepts,
    timeWindow: row.time_window,
    notes: row.notes,
    isArchived: row.is_archived,
    archivedAt: row.archived_at,
    timesUsed: row.times_used,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCarrierTemplates(carrierId: string) {
  if (!hasSupabaseEnv()) {
    return [] as TripTemplate[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("trip_templates")
    .select("*")
    .eq("carrier_id", carrierId)
    .eq("is_archived", false)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "template_query_failed");
  }

  return (data ?? []).map(toTripTemplate);
}

export async function createTemplate(
  carrierId: string,
  data: CreateTripTemplateInput,
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = createTemplateSchema.safeParse(data);

  if (!parsed.success) {
    throw new AppError("Template payload is invalid.", 400, "invalid_template");
  }

  const supabase = createServerSupabaseClient();
  const minimumBasePriceCents = getEffectiveMinimumBasePriceCents({
    originLatitude: parsed.data.originLatitude,
    originLongitude: parsed.data.originLongitude,
    destinationLatitude: parsed.data.destinationLatitude,
    destinationLongitude: parsed.data.destinationLongitude,
    minimumBasePriceCents: parsed.data.minimumBasePriceCents,
  });
  const suggestedPriceCents = Math.max(
    parsed.data.suggestedPriceCents,
    minimumBasePriceCents,
  );
  const insertPayload: Database["public"]["Tables"]["trip_templates"]["Insert"] = {
    carrier_id: carrierId,
    name: parsed.data.name,
    origin_suburb: parsed.data.originSuburb,
    origin_postcode: parsed.data.originPostcode,
    origin_point: toGeographyPoint(parsed.data.originLongitude, parsed.data.originLatitude),
    destination_suburb: parsed.data.destinationSuburb,
    destination_postcode: parsed.data.destinationPostcode,
    destination_point: toGeographyPoint(
      parsed.data.destinationLongitude,
      parsed.data.destinationLatitude,
    ),
    space_size: parsed.data.spaceSize,
    available_volume_m3: parsed.data.availableVolumeM3 ?? null,
    max_weight_kg: parsed.data.maxWeightKg ?? null,
    detour_radius_km: parsed.data.detourRadiusKm,
    suggested_price_cents: suggestedPriceCents,
    minimum_base_price_cents: minimumBasePriceCents,
    stairs_ok: parsed.data.stairsOk,
    stairs_extra_cents: parsed.data.stairsExtraCents,
    helper_extra_cents: parsed.data.helperExtraCents,
    helper_available: parsed.data.helperAvailable,
    accepts: parsed.data.accepts,
    time_window: parsed.data.timeWindow,
    notes: parsed.data.notes ?? null,
  };

  const { data: template, error } = await supabase
    .from("trip_templates")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "template_create_failed");
  }

  return toTripTemplate(template);
}

export async function createTemplateFromTrip(
  tripId: string,
  carrierId: string,
  name: string,
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const supabase = createServerSupabaseClient();
  const { data: listing, error } = await supabase
    .from("capacity_listings")
    .select("*")
    .eq("id", tripId)
    .eq("carrier_id", carrierId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "trip_lookup_failed");
  }

  if (!listing) {
    throw new AppError("Trip not found.", 404, "trip_not_found");
  }

  const origin = parsePoint(listing.origin_point);
  const destination = parsePoint(listing.destination_point);

  if (
    origin.latitude === undefined ||
    origin.longitude === undefined ||
    destination.latitude === undefined ||
    destination.longitude === undefined
  ) {
    throw new AppError("Trip route points are incomplete.", 400, "trip_route_incomplete");
  }

  return createTemplate(carrierId, {
    name,
    originSuburb: listing.origin_suburb,
    originPostcode: listing.origin_postcode,
    originLatitude: origin.latitude,
    originLongitude: origin.longitude,
    destinationSuburb: listing.destination_suburb,
    destinationPostcode: listing.destination_postcode,
    destinationLatitude: destination.latitude,
    destinationLongitude: destination.longitude,
    spaceSize: listing.space_size,
    availableVolumeM3: listing.available_volume_m3,
    maxWeightKg: Math.round(Number(listing.available_weight_kg ?? 0)) || null,
    detourRadiusKm: Math.round(Number(listing.detour_radius_km)),
    suggestedPriceCents: listing.price_cents,
    minimumBasePriceCents: listing.minimum_base_price_cents,
    stairsOk: listing.stairs_ok,
    stairsExtraCents: listing.stairs_extra_cents,
    helperExtraCents: listing.helper_extra_cents,
    helperAvailable: listing.helper_available,
    accepts: [
      ...(listing.accepts_furniture ? ["furniture"] : []),
      ...(listing.accepts_boxes ? ["boxes"] : []),
      ...(listing.accepts_appliances ? ["appliance"] : []),
      ...(listing.accepts_fragile ? ["fragile"] : []),
    ],
    timeWindow: listing.time_window,
    notes: listing.special_notes ?? undefined,
  });
}

export async function createTripFromTemplate(
  templateId: string,
  carrierId: string,
  overrides: {
    tripDate: string;
    timeWindow?: string;
    priceCents?: number;
  },
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = templatePostSchema.safeParse(overrides);

  if (!parsed.success) {
    throw new AppError("Template post payload is invalid.", 400, "invalid_template_post");
  }

  const supabase = createServerSupabaseClient();
  const [{ data: template, error: templateError }, { data: vehicle, error: vehicleError }] =
    await Promise.all([
      supabase
      .from("trip_templates")
      .select("*")
      .eq("id", templateId)
      .eq("carrier_id", carrierId)
      .eq("is_archived", false)
      .maybeSingle(),
      supabase
        .from("vehicles")
        .select("id")
        .eq("carrier_id", carrierId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

  if (templateError) {
    throw new AppError(templateError.message, 500, "template_lookup_failed");
  }

  if (!template) {
    throw new AppError("Template not found.", 404, "template_not_found");
  }

  if (vehicleError) {
    throw new AppError(vehicleError.message, 500, "vehicle_lookup_failed");
  }

  if (!vehicle) {
    throw new AppError("Add an active vehicle before quick posting.", 400, "vehicle_missing");
  }

  const accepted = new Set(template.accepts);
  const minimumBasePriceCents = Math.max(
    parsed.data.minimumBasePriceCents ?? 0,
    template.minimum_base_price_cents,
  );
  const priceCents = parsed.data.priceCents ?? template.suggested_price_cents;

  if (priceCents < minimumBasePriceCents) {
    throw new AppError(
      `Trips from this template need to be at least $${(minimumBasePriceCents / 100).toFixed(0)}.`,
      400,
      "template_trip_price_below_floor",
    );
  }

  const insertPayload: Database["public"]["Tables"]["capacity_listings"]["Insert"] = {
    carrier_id: carrierId,
    vehicle_id: vehicle.id,
    origin_suburb: template.origin_suburb,
    origin_postcode: template.origin_postcode,
    origin_point: template.origin_point,
    destination_suburb: template.destination_suburb,
    destination_postcode: template.destination_postcode,
    destination_point: template.destination_point,
    detour_radius_km: template.detour_radius_km,
    trip_date: parsed.data.tripDate,
    time_window: parsed.data.timeWindow ?? template.time_window,
    space_size: template.space_size,
    available_volume_m3: template.available_volume_m3,
    available_weight_kg: template.max_weight_kg,
    price_cents: priceCents,
    minimum_base_price_cents: minimumBasePriceCents,
    suggested_price_cents: template.suggested_price_cents,
    accepts_furniture: accepted.has("furniture"),
    accepts_boxes: accepted.has("boxes"),
    accepts_appliances: accepted.has("appliance"),
    accepts_fragile: accepted.has("fragile"),
    stairs_ok: template.stairs_ok,
    stairs_extra_cents: template.stairs_extra_cents,
    helper_available: template.helper_available,
    helper_extra_cents: template.helper_extra_cents,
    special_notes: template.notes,
    source_template_id: template.id,
    status: "active",
    remaining_capacity_pct: 100,
  };

  const { data: listing, error: listingError } = await supabase
    .from("capacity_listings")
    .insert(insertPayload)
    .select("id")
    .single();

  if (listingError) {
    throw new AppError(listingError.message, 500, "template_trip_create_failed");
  }

  const { error: templateUpdateError } = await supabase
    .from("trip_templates")
    .update({
      times_used: template.times_used + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", template.id);

  if (templateUpdateError) {
    throw new AppError(templateUpdateError.message, 500, "template_usage_update_failed");
  }

  const trip = await getTripById(listing.id);

  if (!trip) {
    throw new AppError("Trip created but could not be loaded.", 500, "trip_lookup_failed");
  }

  return trip;
}

export async function deleteTemplate(templateId: string, carrierId: string) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("trip_templates")
    .delete()
    .eq("id", templateId)
    .eq("carrier_id", carrierId);

  if (error) {
    throw new AppError(error.message, 500, "template_delete_failed");
  }
}

export async function listCarrierTemplatesIncludingArchived(carrierId: string) {
  if (!hasSupabaseEnv()) {
    return [] as TripTemplate[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("trip_templates")
    .select("*")
    .eq("carrier_id", carrierId)
    .order("is_archived", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "template_query_failed");
  }

  return (data ?? []).map(toTripTemplate);
}

export async function updateTemplate(
  templateId: string,
  carrierId: string,
  patch: {
    name?: string;
    notes?: string | null;
    isArchived?: boolean;
  },
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const supabase = createServerSupabaseClient();
  const nextPatch: Database["public"]["Tables"]["trip_templates"]["Update"] = {};

  if (typeof patch.name === "string") {
    nextPatch.name = patch.name.trim();
  }

  if (patch.notes !== undefined) {
    nextPatch.notes = patch.notes?.trim() ? patch.notes.trim() : null;
  }

  if (typeof patch.isArchived === "boolean") {
    nextPatch.is_archived = patch.isArchived;
    nextPatch.archived_at = patch.isArchived ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("trip_templates")
    .update(nextPatch)
    .eq("id", templateId)
    .eq("carrier_id", carrierId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "template_update_failed");
  }

  return toTripTemplate(data);
}

export async function duplicateTemplate(templateId: string, carrierId: string) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const supabase = createServerSupabaseClient();
  const { data: template, error } = await supabase
    .from("trip_templates")
    .select("*")
    .eq("id", templateId)
    .eq("carrier_id", carrierId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "template_lookup_failed");
  }

  if (!template) {
    throw new AppError("Template not found.", 404, "template_not_found");
  }

  const { data: copy, error: copyError } = await supabase
    .from("trip_templates")
    .insert({
      carrier_id: template.carrier_id,
      name: `${template.name} copy`,
      origin_suburb: template.origin_suburb,
      origin_postcode: template.origin_postcode,
      origin_point: template.origin_point,
      destination_suburb: template.destination_suburb,
      destination_postcode: template.destination_postcode,
      destination_point: template.destination_point,
      space_size: template.space_size,
      available_volume_m3: template.available_volume_m3,
      max_weight_kg: template.max_weight_kg,
      detour_radius_km: template.detour_radius_km,
      suggested_price_cents: template.suggested_price_cents,
      stairs_ok: template.stairs_ok,
      stairs_extra_cents: template.stairs_extra_cents,
      helper_extra_cents: template.helper_extra_cents,
      helper_available: template.helper_available,
      accepts: template.accepts,
      time_window: template.time_window,
      notes: template.notes,
      is_archived: false,
      archived_at: null,
      times_used: 0,
      last_used_at: null,
    })
    .select("*")
    .single();

  if (copyError) {
    throw new AppError(copyError.message, 500, "template_duplicate_failed");
  }

  return toTripTemplate(copy);
}

export async function getCarrierTemplateInsights(carrierId: string) {
  if (!hasSupabaseEnv()) {
    return {
      insights: [] as TemplateInsight[],
      suggestions: [] as RecurringTemplateSuggestion[],
    };
  }

  const supabase = createServerSupabaseClient();
  const [templates, listings] = await Promise.all([
    listCarrierTemplatesIncludingArchived(carrierId),
    supabase
      .from("capacity_listings")
      .select("id, source_template_id, trip_date, bookings(id, status, carrier_payout_cents)")
      .eq("carrier_id", carrierId)
      .not("source_template_id", "is", null),
  ]);

  if (listings.error) {
    throw new AppError(listings.error.message, 500, "template_insights_lookup_failed");
  }

  const insightMap = new Map<string, TemplateInsight>();

  for (const template of templates) {
    insightMap.set(template.id, {
      templateId: template.id,
      tripCount: 0,
      bookingCount: 0,
      completionRatePct: 0,
      totalEarningsCents: 0,
    });
  }

  const routeGroups = new Map<
    string,
    { templateIds: string[]; weekdays: number[] }
  >();

  for (const listing of listings.data ?? []) {
    const templateId = listing.source_template_id as string | null;

    if (!templateId || !insightMap.has(templateId)) {
      continue;
    }

    const insight = insightMap.get(templateId)!;
    const bookings =
      ((listing.bookings as Array<{ id: string; status: string; carrier_payout_cents: number }> | null) ??
        []);

    insight.tripCount += 1;
    insight.bookingCount += bookings.length;
    insight.totalEarningsCents += bookings
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + Number(booking.carrier_payout_cents ?? 0), 0);

    const completedCount = bookings.filter((booking) => booking.status === "completed").length;

    if (insight.tripCount > 0) {
      const nextCompletedTrips =
        (insight.completionRatePct / 100) * (insight.tripCount - 1) + (completedCount > 0 ? 1 : 0);
      insight.completionRatePct = Math.round((nextCompletedTrips / insight.tripCount) * 100);
    }

    const template = templates.find((item) => item.id === templateId);

    if (template) {
      const routeLabel = `${template.originSuburb} → ${template.destinationSuburb}`;
      const nextGroup = routeGroups.get(routeLabel) ?? { templateIds: [], weekdays: [] };
      nextGroup.templateIds.push(templateId);
      nextGroup.weekdays.push(new Date(`${listing.trip_date}T00:00:00`).getDay());
      routeGroups.set(routeLabel, nextGroup);
    }
  }

  const suggestions = Array.from(routeGroups.entries())
    .filter(([, group]) => group.templateIds.length >= 2)
    .map(([routeLabel, group]) => {
      const weekdayCounts = group.weekdays.reduce<Record<number, number>>((accumulator, weekday) => {
        accumulator[weekday] = (accumulator[weekday] ?? 0) + 1;
        return accumulator;
      }, {});
      const nextWeekday = Number(
        Object.entries(weekdayCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "5",
      );

      return {
        routeLabel,
        templateIds: Array.from(new Set(group.templateIds)),
        templateCount: group.templateIds.length,
        nextWeekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][nextWeekday],
        nextTripDate: getNextWeekdayDate(nextWeekday),
      } satisfies RecurringTemplateSuggestion;
    });

  return {
    insights: Array.from(insightMap.values()),
    suggestions,
  };
}
