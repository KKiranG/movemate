import {
  getListingStatusFromCapacity,
  getRemainingCapacityPctForListing,
} from "@/lib/booking-capacity";
import { canTransitionBooking } from "@/lib/status-machine";
import { hasSupabaseEnv, hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sendTransactionalEmail } from "@/lib/notifications";
import { getStripeServerClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { toBooking, type BookingJoinedRecord } from "@/lib/data/mappers";
import { bookingSchema, type BookingInput } from "@/lib/validation/booking";
import type { Database } from "@/types/database";

async function getBookingRowForUser(userId: string, bookingId: string) {
  const supabase = createServerSupabaseClient();
  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const bookingQuery = supabase
    .from("bookings")
    .select("*, events:booking_events(*)")
    .eq("id", bookingId);

  if (carrier?.id) {
    bookingQuery.eq("carrier_id", carrier.id);
  } else if (customer?.id) {
    bookingQuery.eq("customer_id", customer.id);
  } else {
    return null;
  }

  const { data, error } = await bookingQuery.maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "booking_lookup_failed");
  }

  return data as unknown as BookingJoinedRecord | null;
}

async function recordBookingEvent(params: {
  bookingId: string;
  actorRole: string;
  actorUserId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createServerSupabaseClient();
  await supabase.from("booking_events").insert({
    booking_id: params.bookingId,
    actor_role: params.actorRole,
    actor_user_id: params.actorUserId ?? null,
    event_type: params.eventType,
    metadata: params.metadata ?? {},
  });
}

async function getBookingNotificationRecipients(params: {
  customerId: string;
  carrierId: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return { customerEmail: null, carrierEmail: null };
  }

  const supabase = createAdminClient();
  const [{ data: customer }, { data: carrier }] = await Promise.all([
    supabase.from("customers").select("email").eq("id", params.customerId).maybeSingle(),
    supabase.from("carriers").select("email").eq("id", params.carrierId).maybeSingle(),
  ]);

  return {
    customerEmail: customer?.email ?? null,
    carrierEmail: carrier?.email ?? null,
  };
}

async function syncListingStatusForBooking(params: {
  listingId: string;
}) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = hasSupabaseAdminEnv()
    ? createAdminClient()
    : createServerSupabaseClient();
  const { data: listing, error: listingError } = await supabase
    .from("capacity_listings")
    .select("id, available_volume_m3, available_weight_kg")
    .eq("id", params.listingId)
    .maybeSingle();

  if (listingError) {
    throw new AppError(listingError.message, 500, "listing_capacity_lookup_failed");
  }

  if (!listing) {
    return;
  }

  const { data: activeBookings, error: activeBookingsError } = await supabase
    .from("bookings")
    .select("id, status, item_dimensions, item_weight_kg, item_category")
    .eq("listing_id", params.listingId)
    .neq("status", "cancelled");

  if (activeBookingsError) {
    throw new AppError(activeBookingsError.message, 500, "listing_active_bookings_failed");
  }

  const activeBookingCount = activeBookings?.length ?? 0;
  const remainingCapacityPct = getRemainingCapacityPctForListing(listing, activeBookings ?? []);

  await supabase
    .from("capacity_listings")
    .update({
      remaining_capacity_pct: remainingCapacityPct,
      status: getListingStatusFromCapacity(activeBookingCount, remainingCapacityPct),
    })
    .eq("id", params.listingId);
}

export async function listUserBookings(userId: string) {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = createServerSupabaseClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!customer) {
    return [];
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*, events:booking_events(*)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "booking_query_failed");
  }

  return ((data ?? []) as unknown as BookingJoinedRecord[]).map(toBooking);
}

export async function listCarrierBookings(userId: string) {
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
    .from("bookings")
    .select("*, events:booking_events(*)")
    .eq("carrier_id", carrier.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "carrier_booking_query_failed");
  }

  return ((data ?? []) as unknown as BookingJoinedRecord[]).map(toBooking);
}

export async function getBookingByIdForUser(userId: string, bookingId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const row = await getBookingRowForUser(userId, bookingId);
  return row ? toBooking(row) : null;
}

export async function createBookingForCustomer(userId: string, input: BookingInput) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = bookingSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError("Booking payload is invalid.", 400, "invalid_booking");
  }

  const supabase = createServerSupabaseClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (customerError) {
    throw new AppError(customerError.message, 500, "customer_lookup_failed");
  }

  if (!customer) {
    throw new AppError("Customer profile not found.", 400, "customer_missing");
  }

  const { data: listing, error: listingError } = await supabase
    .from("capacity_listings")
    .select("*")
    .eq("id", parsed.data.listingId)
    .maybeSingle();

  if (listingError) {
    throw new AppError(listingError.message, 500, "listing_lookup_failed");
  }

  if (!listing) {
    throw new AppError("Trip not found.", 404, "trip_not_found");
  }

  if (listing.carrier_id !== parsed.data.carrierId) {
    throw new AppError("Trip/carrier mismatch.", 400, "carrier_mismatch");
  }

  const { data: bookingId, error } = await supabase.rpc("create_booking_atomic", {
    p_actor_user_id: userId,
    p_carrier_id: parsed.data.carrierId,
    p_customer_id: customer.id,
    p_dropoff_access_notes: parsed.data.dropoffAccessNotes ?? null,
    p_dropoff_address: parsed.data.dropoffAddress,
    p_dropoff_contact_name: parsed.data.dropoffContactName ?? null,
    p_dropoff_contact_phone: parsed.data.dropoffContactPhone ?? null,
    p_dropoff_lat: parsed.data.dropoffLatitude,
    p_dropoff_lng: parsed.data.dropoffLongitude,
    p_dropoff_postcode: parsed.data.dropoffPostcode,
    p_dropoff_suburb: parsed.data.dropoffSuburb,
    p_item_category: parsed.data.itemCategory,
    p_item_description: parsed.data.itemDescription,
    p_item_dimensions: parsed.data.itemDimensions ?? null,
    p_item_photo_urls: parsed.data.itemPhotoUrls ?? [],
    p_item_weight_kg: parsed.data.itemWeightKg ?? null,
    p_listing_id: parsed.data.listingId,
    p_needs_helper: parsed.data.needsHelper,
    p_needs_stairs: parsed.data.needsStairs,
    p_pickup_access_notes: parsed.data.pickupAccessNotes ?? null,
    p_pickup_address: parsed.data.pickupAddress,
    p_pickup_contact_name: parsed.data.pickupContactName ?? null,
    p_pickup_contact_phone: parsed.data.pickupContactPhone ?? null,
    p_pickup_lat: parsed.data.pickupLatitude,
    p_pickup_lng: parsed.data.pickupLongitude,
    p_pickup_postcode: parsed.data.pickupPostcode,
    p_pickup_suburb: parsed.data.pickupSuburb,
    p_special_instructions: parsed.data.specialInstructions ?? null,
  });

  if (error) {
    if (error.message.includes("listing_not_bookable")) {
      throw new AppError(
        "This trip is no longer available for booking.",
        409,
        "listing_not_bookable",
      );
    }

    if (error.message.includes("listing_not_found")) {
      throw new AppError("Trip not found.", 404, "trip_not_found");
    }

    if (error.message.includes("carrier_mismatch")) {
      throw new AppError("Trip/carrier mismatch.", 400, "carrier_mismatch");
    }

    throw new AppError(error.message, 500, "booking_create_failed");
  }

  const booking = await getBookingByIdForUser(userId, bookingId);

  if (!booking) {
    throw new AppError("Booking created but could not be loaded.", 500, "booking_lookup_failed");
  }

  await sendTransactionalEmail({
    to: customer.email,
    subject: "Booking received",
    html: `<p>Your moverrr booking has been created and is awaiting carrier confirmation.</p>`,
  });

  const recipients = await getBookingNotificationRecipients({
    customerId: customer.id,
    carrierId: parsed.data.carrierId,
  });

  if (recipients.carrierEmail) {
    await sendTransactionalEmail({
      to: recipients.carrierEmail,
      subject: "New booking request received",
      html: "<p>A customer has booked into one of your moverrr trips. Please review and confirm the booking.</p>",
    });
  }

  return booking;
}

export async function createPaymentIntentForBooking(userId: string, bookingId: string) {
  const booking = await getBookingByIdForUser(userId, bookingId);

  if (!booking) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is not configured.", 503, "stripe_unavailable");
  }

  const stripe = getStripeServerClient();

  if (booking.stripePaymentIntentId) {
    const existingIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);

    if (existingIntent.status !== "canceled") {
      return existingIntent;
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: booking.pricing.totalPriceCents,
    currency: "aud",
    capture_method: "manual",
    metadata: {
      bookingId: booking.id,
      listingId: booking.listingId,
    },
  });

  const supabase = createServerSupabaseClient();
  await supabase
    .from("bookings")
    .update({
      stripe_payment_intent_id: intent.id,
    })
    .eq("id", booking.id);

  await recordBookingEvent({
    bookingId: booking.id,
    actorRole: "customer",
    actorUserId: userId,
    eventType: "payment_intent_created",
    metadata: {
      paymentIntentId: intent.id,
      status: intent.status,
    },
  });

  return intent;
}

export async function updateBookingStatusForActor(params: {
  userId: string;
  bookingId: string;
  nextStatus: Database["public"]["Tables"]["bookings"]["Row"]["status"];
  actorRole: "carrier" | "customer" | "admin";
  pickupProofPhotoUrl?: string;
  deliveryProofPhotoUrl?: string;
  cancellationReason?: string;
}) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const row =
    params.actorRole === "admin" && hasSupabaseAdminEnv()
      ? ((await createAdminClient()
          .from("bookings")
          .select("*, events:booking_events(*)")
          .eq("id", params.bookingId)
          .maybeSingle()).data as unknown as BookingJoinedRecord | null)
      : await getBookingRowForUser(params.userId, params.bookingId);

  if (!row) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  if (!canTransitionBooking(row.status, params.nextStatus)) {
    throw new AppError("Invalid booking transition.", 400, "invalid_booking_transition");
  }

  // Guard: disputed → completed requires the dispute to be resolved or closed
  if (row.status === "disputed" && params.nextStatus === "completed") {
    const disputeClient = hasSupabaseAdminEnv()
      ? createAdminClient()
      : createServerSupabaseClient();
    const { data: openDispute } = await disputeClient
      .from("disputes")
      .select("id, status")
      .eq("booking_id", params.bookingId)
      .in("status", ["open", "investigating"])
      .maybeSingle();

    if (openDispute) {
      throw new AppError(
        "Cannot mark booking as completed while a dispute is open or under investigation.",
        409,
        "dispute_not_resolved",
      );
    }
  }

  if (params.nextStatus === "picked_up" && !params.pickupProofPhotoUrl) {
    throw new AppError(
      "Pickup proof is required before marking a booking as picked up.",
      400,
      "pickup_proof_required",
    );
  }

  if (params.nextStatus === "delivered" && !params.deliveryProofPhotoUrl) {
    throw new AppError(
      "Delivery proof is required before marking a booking as delivered.",
      400,
      "delivery_proof_required",
    );
  }

  const patch: Database["public"]["Tables"]["bookings"]["Update"] = {
    status: params.nextStatus,
  };

  if (params.nextStatus === "picked_up") {
    patch.pickup_at = new Date().toISOString();
    patch.pickup_proof_photo_url = params.pickupProofPhotoUrl ?? row.pickup_proof_photo_url;
  }

  if (params.nextStatus === "delivered") {
    patch.delivered_at = new Date().toISOString();
    patch.delivery_proof_photo_url =
      params.deliveryProofPhotoUrl ?? row.delivery_proof_photo_url;
  }

  if (params.nextStatus === "completed") {
    patch.completed_at = new Date().toISOString();
    patch.customer_confirmed_at = new Date().toISOString();
  }

  if (params.nextStatus === "cancelled") {
    patch.cancelled_at = new Date().toISOString();
    patch.cancellation_reason = params.cancellationReason ?? "Cancelled by user";
  }

  const supabase =
    params.actorRole === "admin" && hasSupabaseAdminEnv()
      ? createAdminClient()
      : createServerSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", params.bookingId)
    .select("*, events:booking_events(*)")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "booking_update_failed");
  }

  await recordBookingEvent({
    bookingId: params.bookingId,
    actorRole: params.actorRole,
    actorUserId: params.userId,
    eventType: `status_${params.nextStatus}`,
    metadata: {
      previousStatus: row.status,
    },
  });

  await syncListingStatusForBooking({
    listingId: data.listing_id,
  });

  if (params.nextStatus === "completed" && data.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
    const stripe = getStripeServerClient();
    await stripe.paymentIntents.capture(data.stripe_payment_intent_id);
    await supabase
      .from("bookings")
      .update({ payment_status: "captured" })
      .eq("id", data.id);
    data.payment_status = "captured";
  }

  const recipients = await getBookingNotificationRecipients({
    customerId: data.customer_id,
    carrierId: data.carrier_id,
  });

  const subjectByStatus: Partial<Record<typeof params.nextStatus, string>> = {
    confirmed: "Your booking has been confirmed",
    picked_up: "Your item has been picked up",
    in_transit: "Your item is in transit",
    delivered: "Your item has been delivered",
    completed: "Your booking is complete",
    cancelled: "Your booking was cancelled",
  };

  const emailTargets =
    params.actorRole === "carrier"
      ? [recipients.customerEmail]
      : [recipients.customerEmail, recipients.carrierEmail];

  await Promise.all(
    emailTargets
      .filter((email): email is string => Boolean(email))
      .map((email) =>
        sendTransactionalEmail({
          to: email,
          subject: subjectByStatus[params.nextStatus] ?? "Booking updated",
          html: `<p>Your moverrr booking is now marked as ${params.nextStatus.replace("_", " ")}.</p>`,
        }),
      ),
  );

  return toBooking(data as unknown as BookingJoinedRecord);
}

export async function listAdminBookings(params?: { page?: number; pageSize?: number }) {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, events:booking_events(*)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(error.message, 500, "admin_booking_query_failed");
  }

  return ((data ?? []) as unknown as BookingJoinedRecord[]).map(toBooking);
}
