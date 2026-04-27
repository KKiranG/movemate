import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toGeographyPoint, toMoveRequest } from "@/lib/data/mappers";
import { getCustomerProfileForUser } from "@/lib/data/profiles";
import { moveRequestSchema, type MoveRequestInput } from "@/lib/validation/move-request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { MoveRequest } from "@/types/move-request";

type MoveRequestRow = Database["public"]["Tables"]["move_requests"]["Row"];

export async function createMoveRequest(customerId: string, params: MoveRequestInput) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = moveRequestSchema.safeParse(params);

  if (!parsed.success) {
    throw new AppError("Move request payload is invalid.", 400, "invalid_move_request");
  }

  const supabase = createServerSupabaseClient();
  const insertPayload: Database["public"]["Tables"]["move_requests"]["Insert"] = {
    customer_id: customerId,
    status: parsed.data.status,
    item_description: parsed.data.itemDescription,
    item_category: parsed.data.itemCategory,
    item_size_class: parsed.data.itemSizeClass ?? null,
    item_weight_band: parsed.data.itemWeightBand ?? null,
    item_dimensions: parsed.data.itemDimensions ?? null,
    item_weight_kg: parsed.data.itemWeightKg ?? null,
    item_photo_urls: parsed.data.itemPhotoUrls,
    pickup_address: parsed.data.pickupAddress,
    pickup_suburb: parsed.data.pickupSuburb,
    pickup_postcode: parsed.data.pickupPostcode,
    pickup_point: toGeographyPoint(parsed.data.pickupLongitude, parsed.data.pickupLatitude),
    pickup_access_notes: parsed.data.pickupAccessNotes ?? null,
    dropoff_address: parsed.data.dropoffAddress,
    dropoff_suburb: parsed.data.dropoffSuburb,
    dropoff_postcode: parsed.data.dropoffPostcode,
    dropoff_point: toGeographyPoint(parsed.data.dropoffLongitude, parsed.data.dropoffLatitude),
    dropoff_access_notes: parsed.data.dropoffAccessNotes ?? null,
    preferred_date: parsed.data.preferredDate ?? null,
    preferred_time_window: parsed.data.preferredTimeWindow ?? null,
    needs_stairs: parsed.data.needsStairs,
    needs_helper: parsed.data.needsHelper,
    customer_mover_preference: parsed.data.customerMoverPreference ?? "one_mover",
    stairs_level_pickup: parsed.data.stairsLevelPickup ?? "none",
    stairs_level_dropoff: parsed.data.stairsLevelDropoff ?? "none",
    lift_available_pickup: parsed.data.liftAvailablePickup ?? false,
    lift_available_dropoff: parsed.data.liftAvailableDropoff ?? false,
    special_instructions: parsed.data.specialInstructions ?? null,
    expires_at: parsed.data.expiresAt ?? null,
  };

  const { data, error } = await supabase
    .from("move_requests")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "move_request_create_failed");
  }

  return toMoveRequest(data as MoveRequestRow);
}

export async function getMoveRequestByIdForCustomer(customerId: string, moveRequestId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("move_requests")
    .select("*")
    .eq("id", moveRequestId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "move_request_lookup_failed");
  }

  return data ? toMoveRequest(data as MoveRequestRow) : null;
}

export async function getMoveRequestByIdForCarrier(carrierId: string, moveRequestId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("move_requests")
    .select("*, booking_requests!inner(id)")
    .eq("id", moveRequestId)
    .eq("booking_requests.carrier_id", carrierId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "move_request_lookup_failed");
  }

  return data ? toMoveRequest(data as MoveRequestRow) : null;
}

export async function listMoveRequestsForCustomer(customerId: string) {
  if (!hasSupabaseEnv()) {
    return [] as MoveRequest[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("move_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "move_request_query_failed");
  }

  return (data ?? []).map((row) => toMoveRequest(row as MoveRequestRow));
}

export async function listRecentMoveRequestsForUser(userId: string, limit = 3) {
  const customer = await getCustomerProfileForUser(userId);

  if (!customer) {
    return [] as MoveRequest[];
  }

  const requests = await listMoveRequestsForCustomer(customer.id);
  return requests.slice(0, Math.max(1, limit));
}

export async function updateMoveRequestStatus(moveRequestId: string, status: MoveRequest["status"]) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("move_requests")
    .update({ status })
    .eq("id", moveRequestId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "move_request_update_failed");
  }

  return toMoveRequest(data as MoveRequestRow);
}

export async function getMoveRequestByIdForAdmin(moveRequestId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("move_requests")
    .select("*")
    .eq("id", moveRequestId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "move_request_lookup_failed");
  }

  return data ? toMoveRequest(data as MoveRequestRow) : null;
}
