import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
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
  nextStatus: Database["public"]["Tables"]["bookings"]["Row"]["status"];
  bookingId: string;
}) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = hasSupabaseAdminEnv()
    ? createAdminClient()
    : createServerSupabaseClient();

  if (
    ["confirmed", "picked_up", "in_transit", "delivered", "completed", "disputed"].includes(
      params.nextStatus,
    )
  ) {
    await supabase
      .from("capacity_listings")
      .update({ status: "booked_partial" })
      .eq("id", params.listingId);
    return;
  }

  if (params.nextStatus === "cancelled") {
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", params.listingId)
      .neq("status", "cancelled")
      .neq("id", params.bookingId);

    await supabase
      .from("capacity_listings")
      .update({ status: activeBookings && activeBookings.length > 0 ? "booked_partial" : "active" })
      .eq("id", params.listingId);
  }
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

  const pricing = calculateBookingBreakdown({
    basePriceCents: listing.price_cents,
    needsStairs: parsed.data.needsStairs,
    stairsExtraCents: listing.stairs_extra_cents,
    needsHelper: parsed.data.needsHelper,
    helperExtraCents: listing.helper_extra_cents,
  });

  const insertPayload: Database["public"]["Tables"]["bookings"]["Insert"] = {
    listing_id: parsed.data.listingId,
    customer_id: customer.id,
    carrier_id: parsed.data.carrierId,
    item_description: parsed.data.itemDescription,
    item_category: parsed.data.itemCategory,
    item_dimensions: parsed.data.itemDimensions ?? null,
    item_weight_kg: parsed.data.itemWeightKg ?? null,
    item_photo_urls: parsed.data.itemPhotoUrls ?? [],
    needs_stairs: parsed.data.needsStairs,
    needs_helper: parsed.data.needsHelper,
    special_instructions: parsed.data.specialInstructions ?? null,
    pickup_address: parsed.data.pickupAddress,
    pickup_suburb: parsed.data.pickupSuburb,
    pickup_postcode: parsed.data.pickupPostcode,
    pickup_point: `SRID=4326;POINT(${parsed.data.pickupLongitude} ${parsed.data.pickupLatitude})`,
    pickup_access_notes: parsed.data.pickupAccessNotes ?? null,
    pickup_contact_name: parsed.data.pickupContactName ?? null,
    pickup_contact_phone: parsed.data.pickupContactPhone ?? null,
    dropoff_address: parsed.data.dropoffAddress,
    dropoff_suburb: parsed.data.dropoffSuburb,
    dropoff_postcode: parsed.data.dropoffPostcode,
    dropoff_point: `SRID=4326;POINT(${parsed.data.dropoffLongitude} ${parsed.data.dropoffLatitude})`,
    dropoff_access_notes: parsed.data.dropoffAccessNotes ?? null,
    dropoff_contact_name: parsed.data.dropoffContactName ?? null,
    dropoff_contact_phone: parsed.data.dropoffContactPhone ?? null,
    base_price_cents: pricing.basePriceCents,
    stairs_fee_cents: pricing.stairsFeeCents,
    helper_fee_cents: pricing.helperFeeCents,
    booking_fee_cents: pricing.bookingFeeCents,
    total_price_cents: pricing.totalPriceCents,
    carrier_payout_cents: pricing.carrierPayoutCents,
    platform_commission_cents: pricing.platformCommissionCents,
    payment_status: "pending",
    status: "pending",
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(insertPayload)
    .select("*, events:booking_events(*)")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "booking_create_failed");
  }

  await recordBookingEvent({
    bookingId: data.id,
    actorRole: "customer",
    actorUserId: userId,
    eventType: "booking_created",
    metadata: {
      listingId: parsed.data.listingId,
      totalPriceCents: pricing.totalPriceCents,
    },
  });

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

  return toBooking(data as unknown as BookingJoinedRecord);
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
      payment_status: "authorized",
    })
    .eq("id", booking.id);

  await recordBookingEvent({
    bookingId: booking.id,
    actorRole: "customer",
    actorUserId: userId,
    eventType: "payment_authorized",
    metadata: {
      paymentIntentId: intent.id,
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
    nextStatus: params.nextStatus,
    bookingId: data.id,
  });

  if (params.nextStatus === "completed" && data.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
    const stripe = getStripeServerClient();
    await stripe.paymentIntents.capture(data.stripe_payment_intent_id);
    await supabase
      .from("bookings")
      .update({ payment_status: "captured" })
      .eq("id", data.id);
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
