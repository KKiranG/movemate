import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toCarrierProfile, toVehicle } from "@/lib/data/mappers";
import { sanitizeText } from "@/lib/utils";
import { carrierOnboardingSchema, type CarrierOnboardingInput } from "@/lib/validation/carrier";
import type { Database } from "@/types/database";

export async function getCarrierByUserId(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "carrier_lookup_failed");
  }

  return data ? toCarrierProfile(data) : null;
}

export async function getCarrierVehicle(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!carrier) {
    return null;
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("carrier_id", carrier.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "vehicle_lookup_failed");
  }

  return data ? toVehicle(data) : null;
}

export async function upsertCarrierOnboarding(
  userId: string,
  payload: CarrierOnboardingInput & {
    vehicleType: Database["public"]["Tables"]["vehicles"]["Row"]["type"];
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleVolumeM3: number;
    vehicleWeightKg: number;
    regoPlate?: string;
  },
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = carrierOnboardingSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError("Carrier onboarding payload is invalid.", 400, "invalid_carrier");
  }

  const supabase = createServerSupabaseClient();
  const { data: authUser } = await supabase.auth.getUser();
  const email = authUser.user?.email ?? payload.email;

  const carrierValues: Database["public"]["Tables"]["carriers"]["Insert"] = {
    user_id: userId,
    business_name: payload.businessName,
    contact_name: payload.contactName,
    phone: payload.phone,
    email,
    abn: payload.abn ?? null,
    bio: payload.bio ?? null,
    licence_photo_url: payload.licencePhotoUrl ?? null,
    insurance_photo_url: payload.insurancePhotoUrl ?? null,
    service_suburbs: payload.serviceSuburbs,
    verification_status: "submitted",
    verification_submitted_at: new Date().toISOString(),
  };

  const { data: carrier, error: carrierError } = await supabase
    .from("carriers")
    .upsert(carrierValues, { onConflict: "user_id" })
    .select("*")
    .single();

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_upsert_failed");
  }

  const vehicleValues = {
    type: payload.vehicleType,
    make: payload.vehicleMake ?? null,
    model: payload.vehicleModel ?? null,
    rego_plate: payload.regoPlate ?? null,
    max_volume_m3: payload.vehicleVolumeM3,
    max_weight_kg: payload.vehicleWeightKg,
    is_active: true,
  };

  const { data: existingVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("carrier_id", carrier.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const vehicleMutation = existingVehicle
    ? supabase
        .from("vehicles")
        .update(vehicleValues)
        .eq("id", existingVehicle.id)
    : supabase.from("vehicles").insert({
        carrier_id: carrier.id,
        ...vehicleValues,
      });

  const { error: vehicleError } = await vehicleMutation;

  if (vehicleError) {
    throw new AppError(vehicleError.message, 500, "vehicle_upsert_failed");
  }

  return toCarrierProfile(carrier);
}

export async function listAdminCarriers(params?: {
  page?: number;
  pageSize?: number;
}) {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(error.message, 500, "admin_carrier_query_failed");
  }

  return (data ?? []).map(toCarrierProfile);
}

export async function verifyCarrier(params: {
  carrierId: string;
  isApproved: boolean;
  notes?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const patch: Database["public"]["Tables"]["carriers"]["Update"] = {
    is_verified: params.isApproved,
    verification_status: params.isApproved ? "verified" : "rejected",
    verified_at: params.isApproved ? new Date().toISOString() : null,
    verification_notes: params.notes ? sanitizeText(params.notes) : null,
  };

  const { data, error } = await supabase
    .from("carriers")
    .update(patch)
    .eq("id", params.carrierId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "carrier_verify_failed");
  }

  return toCarrierProfile(data);
}
