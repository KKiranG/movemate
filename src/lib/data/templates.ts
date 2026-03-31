import { z } from "zod";

import { getTripById } from "@/lib/data/trips";
import { toGeographyPoint } from "@/lib/data/mappers";
import { hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { CreateTripTemplateInput, TripTemplate } from "@/types/carrier";
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
});

type TripTemplateRow = Database["public"]["Tables"]["trip_templates"]["Row"];

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
    stairsOk: row.stairs_ok,
    stairsExtraCents: row.stairs_extra_cents,
    helperExtraCents: row.helper_extra_cents,
    helperAvailable: row.helper_available,
    accepts: row.accepts,
    timeWindow: row.time_window,
    notes: row.notes,
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
    suggested_price_cents: parsed.data.suggestedPriceCents,
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
    price_cents: parsed.data.priceCents ?? template.suggested_price_cents,
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
