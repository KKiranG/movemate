import { PRIVATE_BUCKETS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toCarrierProfile, toVehicle } from "@/lib/data/mappers";
import { getPrivateFileDisplay } from "@/lib/storage";
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

export async function getCarrierById(carrierId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("id", carrierId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "carrier_lookup_failed");
  }

  return data ? toCarrierProfile(data) : null;
}

export async function getCarrierVehicle(userId: string) {
  const vehicles = await listCarrierVehicles(userId);
  return vehicles[0] ?? null;
}

export async function listCarrierVehicles(userId: string) {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!carrier) {
    return [];
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("carrier_id", carrier.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError(error.message, 500, "vehicle_lookup_failed");
  }

  return (data ?? []).map(toVehicle);
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
    vehiclePhotoUrl?: string;
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
  const { data: carrierId, error: onboardingError } = await supabase.rpc(
    "upsert_carrier_onboarding_atomic",
    {
      p_user_id: userId,
      p_business_name: payload.businessName,
      p_contact_name: payload.contactName,
      p_phone: payload.phone,
      p_email: email,
      p_abn: payload.abn ?? null,
      p_bio: payload.bio ?? null,
      p_licence_photo_url: payload.licencePhotoUrl ?? null,
      p_insurance_photo_url: payload.insurancePhotoUrl ?? null,
      p_vehicle_photo_url: payload.vehiclePhotoUrl ?? null,
      p_service_suburbs: payload.serviceSuburbs,
      p_licence_expiry_date: payload.licenceExpiryDate ?? null,
      p_insurance_expiry_date: payload.insuranceExpiryDate ?? null,
      p_vehicle_type: payload.vehicleType,
      p_vehicle_make: payload.vehicleMake ?? null,
      p_vehicle_model: payload.vehicleModel ?? null,
      p_vehicle_volume_m3: payload.vehicleVolumeM3,
      p_vehicle_weight_kg: payload.vehicleWeightKg,
      p_rego_plate: payload.regoPlate ?? null,
    },
  );

  if (onboardingError || !carrierId) {
    throw new AppError(
      onboardingError?.message ?? "Carrier onboarding could not be saved atomically.",
      500,
      "carrier_onboarding_atomic_failed",
    );
  }

  const carrier = await getCarrierById(carrierId);

  if (!carrier) {
    throw new AppError("Carrier profile could not be reloaded.", 500, "carrier_reload_failed");
  }

  return carrier;
}

export async function getPublicCarrierProfile(carrierId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const [{ data: carrier, error: carrierError }, { data: activeListings, error: listingsError }] =
    await Promise.all([
      supabase.from("carriers").select("*").eq("id", carrierId).maybeSingle(),
      supabase
        .from("capacity_listings")
        .select("id")
        .eq("carrier_id", carrierId)
        .in("status", ["active", "booked_partial"])
        .order("trip_date", { ascending: true }),
    ]);

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_lookup_failed");
  }

  if (listingsError) {
    throw new AppError(listingsError.message, 500, "carrier_listings_lookup_failed");
  }

  if (!carrier) {
    return null;
  }

  const [vehicle, bookingStats] = await Promise.all([
    createServerSupabaseClient()
      .from("vehicles")
      .select("*")
      .eq("carrier_id", carrierId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    createServerSupabaseClient()
      .from("bookings")
      .select("id, status, pickup_proof_photo_url, delivery_proof_photo_url")
      .eq("carrier_id", carrierId),
  ]);
  const proofBackedJobCount =
    bookingStats.data?.filter(
      (booking) =>
        booking.status === "completed" &&
        Boolean(booking.pickup_proof_photo_url) &&
        Boolean(booking.delivery_proof_photo_url),
    ).length ?? 0;

  return {
    carrier: toCarrierProfile(carrier),
    activeListingCount: activeListings?.length ?? 0,
    completedJobCount:
      bookingStats.data?.filter((booking) => booking.status === "completed").length ?? 0,
    proofBackedJobCount,
    vehicle: vehicle.data ? toVehicle(vehicle.data) : null,
  };
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

export async function getAdminCarrierDetail(carrierId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const [{ data: carrier, error: carrierError }, { data: vehicle }, { data: bookings }, { data: reviews }, { data: riskSignals }] =
    await Promise.all([
      supabase.from("carriers").select("*").eq("id", carrierId).maybeSingle(),
      supabase
        .from("vehicles")
        .select("*")
        .eq("carrier_id", carrierId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select(
          "id, booking_reference, status, total_price_cents, payment_status, created_at, completed_at, pickup_proof_photo_url, delivery_proof_photo_url",
        )
        .eq("carrier_id", carrierId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("reviews")
        .select("id, rating, comment, created_at")
        .eq("reviewee_id", carrierId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("analytics_events")
        .select("id, created_at, metadata")
        .eq("event_name", "off_platform_payment_detected")
        .contains("metadata", { carrierId })
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "admin_carrier_lookup_failed");
  }

  if (!carrier) {
    return null;
  }

  const [licenceDocument, insuranceDocument, vehicleDocument] = await Promise.all([
    getPrivateFileDisplay({
      bucket: PRIVATE_BUCKETS.carrierDocuments,
      path: carrier.licence_photo_url,
    }),
    getPrivateFileDisplay({
      bucket: PRIVATE_BUCKETS.carrierDocuments,
      path: carrier.insurance_photo_url,
    }),
    getPrivateFileDisplay({
      bucket: PRIVATE_BUCKETS.vehiclePhotos,
      path: carrier.vehicle_photo_url,
    }),
  ]);

  const completedBookings =
    bookings?.filter((booking) => booking.status === "completed").length ?? 0;
  const proofBackedJobs =
    bookings?.filter(
      (booking) =>
        booking.status === "completed" &&
        Boolean(booking.pickup_proof_photo_url) &&
        Boolean(booking.delivery_proof_photo_url),
    ).length ?? 0;

  return {
    carrier: toCarrierProfile(carrier),
    vehicle: vehicle ? toVehicle(vehicle) : null,
    documents: {
      licence: licenceDocument,
      insurance: insuranceDocument,
      vehicle: vehicleDocument,
    },
    completedBookings,
    proofBackedJobs,
    bookings:
      bookings?.map((booking) => ({
        id: booking.id,
        bookingReference: booking.booking_reference,
        status: booking.status,
        totalPriceCents: booking.total_price_cents,
        paymentStatus: booking.payment_status,
        createdAt: booking.created_at,
        completedAt: booking.completed_at,
        proofComplete:
          Boolean(booking.pickup_proof_photo_url) && Boolean(booking.delivery_proof_photo_url),
      })) ?? [],
    reviews:
      reviews?.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
      })) ?? [],
    offPlatformPaymentSignals:
      riskSignals?.map((signal) => ({
        id: signal.id,
        createdAt: signal.created_at,
        specialInstructions:
          typeof signal.metadata === "object" &&
          signal.metadata !== null &&
          "specialInstructions" in signal.metadata &&
          typeof (signal.metadata as Record<string, unknown>).specialInstructions === "string"
            ? ((signal.metadata as Record<string, unknown>).specialInstructions as string)
            : null,
      })) ?? [],
  };
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

export async function updateCarrierVerificationNotes(params: {
  carrierId: string;
  notes?: string | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const patch: Database["public"]["Tables"]["carriers"]["Update"] = {
    verification_notes: params.notes?.trim() ? sanitizeText(params.notes) : null,
  };

  const { data, error } = await supabase
    .from("carriers")
    .update(patch)
    .eq("id", params.carrierId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "carrier_note_update_failed");
  }

  return toCarrierProfile(data);
}

export async function updateAdminCarrierOpsFields(params: {
  carrierId: string;
  verificationNotes?: string | null;
  internalNotes?: string | null;
  internalTags?: string[] | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const patch: Database["public"]["Tables"]["carriers"]["Update"] = {};

  if (params.verificationNotes !== undefined) {
    patch.verification_notes = params.verificationNotes?.trim()
      ? sanitizeText(params.verificationNotes)
      : null;
  }

  if (params.internalNotes !== undefined) {
    patch.internal_notes = params.internalNotes?.trim()
      ? sanitizeText(params.internalNotes)
      : null;
  }

  if (params.internalTags !== undefined) {
    patch.internal_tags =
      params.internalTags?.map((tag) => sanitizeText(tag).toLowerCase()).filter(Boolean) ?? [];
  }

  const { data, error } = await supabase
    .from("carriers")
    .update(patch)
    .eq("id", params.carrierId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "carrier_ops_update_failed");
  }

  return toCarrierProfile(data);
}
