import { hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCustomerProfileForUser(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "customer_lookup_failed");
  }

  return data;
}

export async function getCustomerProfileSummaryForUser(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, email, full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "customer_lookup_failed");
  }

  return data;
}

export async function updateCustomerProfileNameForUser(params: {
  userId: string;
  fullName: string;
}) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const fullName = params.fullName.trim().replace(/\s+/g, " ");

  if (fullName.length < 2 || fullName.length > 120) {
    throw new AppError("Enter a name between 2 and 120 characters.", 400, "invalid_profile_name");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .update({ full_name: fullName })
    .eq("user_id", params.userId)
    .select("id, email, full_name")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "customer_profile_update_failed");
  }

  return data;
}

export async function requireCustomerProfileForUser(userId: string) {
  const customer = await getCustomerProfileForUser(userId);

  if (!customer) {
    throw new AppError("Customer profile not found.", 400, "customer_missing");
  }

  return customer;
}

export async function getCarrierProfileForUser(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("id, email, activation_status, verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "carrier_lookup_failed");
  }

  return data;
}

export async function requireCarrierProfileForUser(userId: string) {
  const carrier = await getCarrierProfileForUser(userId);

  if (!carrier) {
    throw new AppError("Carrier profile not found.", 400, "carrier_missing");
  }

  return carrier;
}
