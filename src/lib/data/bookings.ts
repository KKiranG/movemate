import { createHash } from "node:crypto";
import Stripe from "stripe";

import { canTransitionBooking } from "@/lib/status-machine";
import { hasSupabaseEnv, hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sendBookingTransactionalEmail } from "@/lib/notifications";
import { captureAppError } from "@/lib/sentry";
import { getStripeServerClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { toBooking, type BookingJoinedRecord } from "@/lib/data/mappers";
import { bookingSchema, type BookingInput } from "@/lib/validation/booking";
import type { Database } from "@/types/database";
import type {
  BookingCancellationReasonCode,
  BookingPaymentStatus,
} from "@/types/booking";
import { getConfirmedBookingChecklist } from "@/lib/booking-presenters";

async function getBookingRowByRole(params: {
  supabase: ReturnType<typeof createServerSupabaseClient>;
  bookingId: string;
  entityId: string;
  role: "carrier" | "customer";
}) {
  const bookingQuery = params.supabase
    .from("bookings")
    .select("*, events:booking_events(*)")
    .eq("id", params.bookingId);

  if (params.role === "carrier") {
    bookingQuery.eq("carrier_id", params.entityId);
  } else {
    bookingQuery.eq("customer_id", params.entityId);
  }

  const { data, error } = await bookingQuery.maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "booking_lookup_failed");
  }

  return (data as unknown as BookingJoinedRecord | null) ?? null;
}

async function getBookingAccessForUser(userId: string, bookingId: string) {
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

  if (carrier?.id) {
    const row = await getBookingRowByRole({
      supabase,
      bookingId,
      entityId: carrier.id,
      role: "carrier",
    });

    if (row) {
      return { row, actorRole: "carrier" as const };
    }
  }

  if (customer?.id) {
    const row = await getBookingRowByRole({
      supabase,
      bookingId,
      entityId: customer.id,
      role: "customer",
    });

    if (row) {
      return { row, actorRole: "customer" as const };
    }
  }

  return null;
}

async function getBookingRowForUser(userId: string, bookingId: string) {
  return (await getBookingAccessForUser(userId, bookingId))?.row ?? null;
}

export async function getBookingActorRoleForUser(userId: string, bookingId: string) {
  const access = await getBookingAccessForUser(userId, bookingId);

  if (!access) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  return access.actorRole;
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

  const supabase = getPrivilegedSupabaseClient();
  await supabase.from("booking_events").insert({
    booking_id: params.bookingId,
    actor_role: params.actorRole,
    actor_user_id: params.actorUserId ?? null,
    event_type: params.eventType,
    metadata: params.metadata ?? {},
  });
}

function getPrivilegedSupabaseClient() {
  return hasSupabaseAdminEnv()
    ? createAdminClient()
    : createServerSupabaseClient();
}

function canActorTransitionBooking(params: {
  actorRole: "carrier" | "customer" | "admin";
  nextStatus: Database["public"]["Tables"]["bookings"]["Row"]["status"];
}) {
  if (params.actorRole === "admin") {
    return true;
  }

  if (["confirmed", "picked_up", "in_transit", "delivered"].includes(params.nextStatus)) {
    return params.actorRole === "carrier";
  }

  if (params.nextStatus === "completed") {
    return params.actorRole === "customer";
  }

  if (params.nextStatus === "cancelled") {
    return true;
  }

  if (params.nextStatus === "disputed") {
    return params.actorRole === "carrier" || params.actorRole === "customer";
  }

  return false;
}

async function markBookingCaptureFailed(params: {
  supabase: ReturnType<typeof createServerSupabaseClient> | ReturnType<typeof createAdminClient>;
  bookingId: string;
  paymentIntentId: string;
  error: unknown;
}) {
  const stripeErrorCode =
    params.error instanceof Stripe.errors.StripeError ? params.error.code ?? null : null;
  const errorMessage =
    params.error instanceof Error ? params.error.message : "Stripe capture failed.";

  await params.supabase
    .from("bookings")
    .update({
      payment_status: "capture_failed",
      payment_failure_code: stripeErrorCode,
      payment_failure_reason: errorMessage,
    })
    .eq("id", params.bookingId);

  captureAppError(
    params.error,
    {
      feature: "payments",
      action: "payment_capture_failed",
      tags: {
        bookingId: params.bookingId,
        paymentIntentId: params.paymentIntentId,
      },
    },
  );
}

function createBookingRequestHash(input: BookingInput) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
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

  const supabase = getPrivilegedSupabaseClient();
  const { error } = await supabase.rpc("recalculate_listing_capacity", {
    p_listing_id: params.listingId,
  });

  if (error) {
    throw new AppError(error.message, 500, "listing_capacity_recalculation_failed");
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

export async function listCarrierBookings(
  userId: string,
  options?: {
    listingId?: string;
  },
) {
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

  const query = supabase
    .from("bookings")
    .select("*, events:booking_events(*)")
    .eq("carrier_id", carrier.id)
    .order("created_at", { ascending: false });

  if (options?.listingId) {
    query.eq("listing_id", options.listingId);
  }

  const { data, error } = await query;

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

  if (!row) {
    return null;
  }

  const booking = toBooking(row);
  const supabase = createServerSupabaseClient();
  const { data: carrier } = await supabase
    .from("carriers")
    .select("business_name, phone")
    .eq("id", booking.carrierId)
    .maybeSingle();

  return {
    ...booking,
    carrierBusinessName: carrier?.business_name ?? undefined,
    carrierPhone: carrier?.phone ?? undefined,
  };
}

export async function createBookingForCustomer(
  userId: string,
  input: BookingInput,
  options?: { idempotencyKey?: string | null },
) {
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

  const { data: carrierProfile } = await supabase
    .from("carriers")
    .select("business_name")
    .eq("id", parsed.data.carrierId)
    .maybeSingle();

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
    p_client_idempotency_key: options?.idempotencyKey?.trim() || null,
    p_idempotency_request_hash:
      options?.idempotencyKey?.trim() ? createBookingRequestHash(parsed.data) : null,
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

    if (error.message.includes("idempotency_key_reused")) {
      throw new AppError(
        "This retry key was already used for a different booking request.",
        409,
        "idempotency_key_reused",
      );
    }

    throw new AppError(error.message, 500, "booking_create_failed");
  }

  const booking = await getBookingByIdForUser(userId, bookingId);

  if (!booking) {
    throw new AppError("Booking created but could not be loaded.", 500, "booking_lookup_failed");
  }

  await sendBookingTransactionalEmail({
    bookingId: booking.id,
    bookingStatus: booking.status,
    emailType: "booking_created_customer",
    to: customer.email,
    subject: `Booking received: ${booking.bookingReference}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;line-height:1.5">
        <h1 style="font-size:20px;margin-bottom:16px">Booking confirmed in moverrr</h1>
        <p>Your booking <strong>${booking.bookingReference}</strong> is now waiting on carrier confirmation.</p>
        <div style="border:1px solid #e5e5e5;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Route:</strong> ${listing.origin_suburb} to ${listing.destination_suburb}</p>
          <p style="margin:0 0 8px"><strong>Pickup window:</strong> ${listing.trip_date} · ${listing.time_window}</p>
          <p style="margin:0 0 8px"><strong>Carrier:</strong> ${carrierProfile?.business_name ?? "Verified moverrr carrier"}</p>
          <p style="margin:0"><strong>Total paid:</strong> ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(booking.pricing.totalPriceCents / 100)}</p>
        </div>
        <p style="margin-bottom:8px"><strong>Preparation checklist</strong></p>
        <ul style="padding-left:20px;margin-top:0">
          <li>Keep access notes and contact numbers handy.</li>
          <li>Make sure the item is ready inside the agreed pickup window.</li>
          <li>Your payment stays in moverrr until proof and completion logic are satisfied.</li>
          <li>If anyone asks for cash, bank transfer, or extra charges outside the listed add-ons, stop and report it in-platform.</li>
          <li>Keep this reference for support: ${booking.bookingReference}</li>
        </ul>
      </div>
    `,
  });

  const recipients = await getBookingNotificationRecipients({
    customerId: customer.id,
    carrierId: parsed.data.carrierId,
  });

  if (recipients.carrierEmail) {
    await sendBookingTransactionalEmail({
      bookingId: booking.id,
      bookingStatus: booking.status,
      emailType: "booking_created_carrier",
      to: recipients.carrierEmail,
      subject: `New booking request: ${booking.bookingReference}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;line-height:1.5">
          <h1 style="font-size:20px;margin-bottom:16px">New booking request</h1>
          <p>Booking <strong>${booking.bookingReference}</strong> has been created on one of your moverrr trips.</p>
          <div style="border:1px solid #e5e5e5;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px"><strong>Route:</strong> ${listing.origin_suburb} to ${listing.destination_suburb}</p>
            <p style="margin:0 0 8px"><strong>Trip window:</strong> ${listing.trip_date} · ${listing.time_window}</p>
            <p style="margin:0"><strong>Customer total:</strong> ${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(booking.pricing.totalPriceCents / 100)}</p>
          </div>
          <p>Please review the booking in your dashboard and confirm it before the pending hold expires.</p>
          <ul style="padding-left:20px;margin-top:12px">
            <li>Keep payment and extra charges inside moverrr.</li>
            <li>Pickup and delivery proof will be required before payout release.</li>
            <li>Important booking replies should still land within 24 hours.</li>
          </ul>
        </div>
      `,
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
    try {
      const existingIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);

      const isCompatibleIntent =
        existingIntent.status !== "canceled" &&
        existingIntent.amount === booking.pricing.totalPriceCents &&
        existingIntent.currency === "aud" &&
        existingIntent.metadata?.bookingId === booking.id;

      if (isCompatibleIntent) {
        return existingIntent;
      }
    } catch (error) {
      if (!(error instanceof Error) || !error.message.toLowerCase().includes("no such payment_intent")) {
        throw error;
      }
    }
  }

  const intent = await stripe.paymentIntents.create(
    {
      amount: booking.pricing.totalPriceCents,
      currency: "aud",
      capture_method: "manual",
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        listingId: booking.listingId,
      },
    },
    {
      idempotencyKey: `booking:${booking.id}`,
    },
  );

  const supabase = createServerSupabaseClient();
  await supabase
    .from("bookings")
    .update({
      stripe_payment_intent_id: intent.id,
      payment_status: "pending",
      payment_failure_code: null,
      payment_failure_reason: null,
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
  cancellationReasonCode?: BookingCancellationReasonCode;
  skipStatusEmails?: boolean;
}) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  if (params.actorRole === "admin" && !hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const access =
    params.actorRole === "admin"
      ? {
          row: ((
            await createAdminClient()
              .from("bookings")
              .select("*, events:booking_events(*)")
              .eq("id", params.bookingId)
              .maybeSingle()
          ).data as unknown as BookingJoinedRecord | null),
          actorRole: "admin" as const,
        }
      : await getBookingAccessForUser(params.userId, params.bookingId);
  const row = access?.row ?? null;

  if (!row) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  if (
    params.actorRole !== "admin" &&
    access?.actorRole &&
    access.actorRole !== params.actorRole
  ) {
    throw new AppError("You cannot update this booking as that role.", 403, "invalid_actor_role");
  }

  if (!canTransitionBooking(row.status, params.nextStatus)) {
    throw new AppError("Invalid booking transition.", 400, "invalid_booking_transition");
  }

  if (!canActorTransitionBooking({ actorRole: params.actorRole, nextStatus: params.nextStatus })) {
    throw new AppError("You cannot perform this booking transition.", 403, "booking_transition_forbidden");
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
    patch.cancellation_reason_code = params.cancellationReasonCode ?? null;
  }

  const supabase =
    params.actorRole === "admin" && hasSupabaseAdminEnv()
      ? createAdminClient()
      : createServerSupabaseClient();

  if (
    params.nextStatus === "completed" &&
    row.stripe_payment_intent_id &&
    process.env.STRIPE_SECRET_KEY
  ) {
    if (row.payment_status !== "captured") {
      const stripe = getStripeServerClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id);

      if (paymentIntent.status === "requires_capture") {
        try {
          await stripe.paymentIntents.capture(row.stripe_payment_intent_id);
        } catch (error) {
          await markBookingCaptureFailed({
            supabase,
            bookingId: row.id,
            paymentIntentId: row.stripe_payment_intent_id,
            error,
          });

          throw new AppError(
            "Stripe capture failed. Booking completion has been held for manual review.",
            409,
            "payment_capture_failed",
          );
        }
      } else if (paymentIntent.status !== "succeeded") {
        throw new AppError(
          "Payment is not ready to be captured.",
          409,
          "payment_not_capturable",
        );
      }

      patch.payment_status = "captured";
      patch.payment_failure_code = null;
      patch.payment_failure_reason = null;
    }
  }

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

  if (
    params.nextStatus === "cancelled" &&
    data.stripe_payment_intent_id &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const stripe = getStripeServerClient();
      const intent = await stripe.paymentIntents.retrieve(data.stripe_payment_intent_id);

      if (intent.status !== "canceled" && intent.status !== "succeeded") {
        await stripe.paymentIntents.cancel(data.stripe_payment_intent_id);
        await supabase
          .from("bookings")
          .update({ payment_status: "authorization_cancelled" })
          .eq("id", data.id);
        data.payment_status = "authorization_cancelled";
      }
    } catch {
      // Best effort: the booking cancellation is already persisted.
    }
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

  if (!params.skipStatusEmails) {
    const checklistHtml =
      params.nextStatus === "confirmed"
        ? `<ul>${getConfirmedBookingChecklist()
            .map((item) => `<li>${item}</li>`)
            .join("")}</ul>`
        : "";
    const statusMessageHtml =
      params.nextStatus === "confirmed"
        ? `<p>Your moverrr booking <strong>${data.booking_reference}</strong> is confirmed.</p><p>Preparation checklist:</p>${checklistHtml}<p>Keep payment and any extras inside moverrr while the booking runs.</p>`
        : params.nextStatus === "delivered"
          ? `<p>Your moverrr booking <strong>${data.booking_reference}</strong> is now marked as delivered.</p><p>Please confirm receipt in moverrr once the handoff is complete, or raise a dispute if anything is wrong.</p>`
          : params.nextStatus === "completed"
            ? `<p>Your moverrr booking <strong>${data.booking_reference}</strong> is complete.</p><p>Proof, completion, and payout release logic have all been advanced in-platform.</p>`
            : params.nextStatus === "cancelled"
              ? `<p>Your moverrr booking <strong>${data.booking_reference}</strong> was cancelled.</p><p>No extra payment should move outside moverrr for this booking.</p>`
              : `<p>Your moverrr booking <strong>${data.booking_reference}</strong> is now marked as ${params.nextStatus.replace("_", " ")}.</p>`;

    await Promise.all(
      emailTargets
        .filter((email): email is string => Boolean(email))
        .map((email) =>
          sendBookingTransactionalEmail({
            bookingId: data.id,
            bookingStatus: params.nextStatus,
            emailType: "booking_status_update",
            to: email,
            subject: `${subjectByStatus[params.nextStatus] ?? "Booking updated"}: ${data.booking_reference}`,
            html: statusMessageHtml,
          }),
        ),
    );
  }

  return toBooking(data as unknown as BookingJoinedRecord);
}

async function getAdminBookingSearchEntityIds(searchQuery: string) {
  const supabase = createAdminClient();
  const [{ data: customers }, { data: carriers }] = await Promise.all([
    supabase
      .from("customers")
      .select("id")
      .ilike("email", `%${searchQuery}%`)
      .limit(25),
    supabase
      .from("carriers")
      .select("id")
      .ilike("email", `%${searchQuery}%`)
      .limit(25),
  ]);

  return {
    customerIds: (customers ?? []).map((row) => row.id),
    carrierIds: (carriers ?? []).map((row) => row.id),
  };
}

const ADMIN_BOOKING_PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "captured",
  "capture_failed",
  "refunded",
  "failed",
  "authorization_cancelled",
] as const satisfies BookingPaymentStatus[];

function applyAdminBookingFilters<T>(query: T, params: {
  searchQuery?: string;
  customerIds: string[];
  carrierIds: string[];
  paymentStatus?: BookingPaymentStatus;
}) {
  let nextQuery = query as {
    or: (filter: string) => unknown;
    eq: (column: string, value: string) => unknown;
  };

  if (params.searchQuery) {
    const filters = [`booking_reference.ilike.%${params.searchQuery}%`];

    if (params.customerIds.length > 0) {
      filters.push(`customer_id.in.(${params.customerIds.join(",")})`);
    }

    if (params.carrierIds.length > 0) {
      filters.push(`carrier_id.in.(${params.carrierIds.join(",")})`);
    }

    nextQuery = nextQuery.or(filters.join(",")) as typeof nextQuery;
  }

  if (params.paymentStatus) {
    nextQuery = nextQuery.eq("payment_status", params.paymentStatus) as typeof nextQuery;
  }

  return nextQuery as T;
}

export async function listAdminBookingsPageData(params?: {
  page?: number;
  pageSize?: number;
  query?: string;
  paymentStatus?: BookingPaymentStatus;
}) {
  if (!hasSupabaseAdminEnv()) {
    return {
      bookings: [],
      totalCount: 0,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 25,
      paymentCounts: Object.fromEntries(
        ADMIN_BOOKING_PAYMENT_STATUSES.map((status) => [status, 0]),
      ) as Record<BookingPaymentStatus, number>,
    };
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const searchQuery = params?.query?.trim();
  let customerIds: string[] = [];
  let carrierIds: string[] = [];

  if (searchQuery) {
    const relatedIds = await getAdminBookingSearchEntityIds(searchQuery);
    customerIds = relatedIds.customerIds;
    carrierIds = relatedIds.carrierIds;
  }

  const supabase = createAdminClient();
  const filterParams = {
    searchQuery,
    customerIds,
    carrierIds,
    paymentStatus: params?.paymentStatus,
  };
  const dataQuery = applyAdminBookingFilters(
    supabase
      .from("bookings")
      .select("*, events:booking_events(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    filterParams,
  );
  const paymentCountQueries = ADMIN_BOOKING_PAYMENT_STATUSES.map(async (status) => {
    const countQuery = applyAdminBookingFilters(
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      {
        searchQuery,
        customerIds,
        carrierIds,
        paymentStatus: status,
      },
    );
    const { count, error } = await countQuery;

    if (error) {
      throw new AppError(error.message, 500, "admin_booking_payment_count_failed");
    }

    return [status, count ?? 0] as const;
  });

  const [{ data, error, count }, paymentCountsEntries] = await Promise.all([
    dataQuery,
    Promise.all(paymentCountQueries),
  ]);

  if (error) {
    throw new AppError(error.message, 500, "admin_booking_query_failed");
  }

  return {
    bookings: ((data ?? []) as unknown as BookingJoinedRecord[]).map(toBooking),
    totalCount: count ?? 0,
    page,
    pageSize,
    paymentCounts: Object.fromEntries(paymentCountsEntries) as Record<BookingPaymentStatus, number>,
  };
}

export async function listAdminBookings(params?: {
  page?: number;
  pageSize?: number;
  query?: string;
  paymentStatus?: BookingPaymentStatus;
}) {
  const { bookings } = await listAdminBookingsPageData(params);
  return bookings;
}

export async function expirePendingBookings(params?: {
  limit?: number;
  now?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return [] as string[];
  }

  const supabase = createAdminClient();
  const now = params?.now ?? new Date().toISOString();
  const { data: staleBookings, error } = await supabase
    .from("bookings")
    .select("id, stripe_payment_intent_id")
    .eq("status", "pending")
    .lte("pending_expires_at", now)
    .order("pending_expires_at", { ascending: true })
    .limit(params?.limit ?? 100);

  if (error) {
    throw new AppError(error.message, 500, "pending_booking_expiry_lookup_failed");
  }

  const expiredIds: string[] = [];

  for (const row of staleBookings ?? []) {
    const booking = await updateBookingStatusForActor({
      userId: "system-expiry-runner",
      bookingId: row.id,
      nextStatus: "cancelled",
      actorRole: "admin",
      cancellationReason: "Expired after the 2-hour pending response window.",
      skipStatusEmails: true,
    });

    await recordBookingEvent({
      bookingId: row.id,
      actorRole: "admin",
      actorUserId: null,
      eventType: "pending_booking_expired",
      metadata: {
        reason: "Expired after the 2-hour pending response window.",
        expiredAt: now,
      },
    });

    if (row.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripeServerClient();
        const intent = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id);

        if (intent.status !== "canceled" && intent.status !== "succeeded") {
          await stripe.paymentIntents.cancel(row.stripe_payment_intent_id);
        }
      } catch {
        // Best effort: booking has already been cancelled and capacity restored.
      }
    }

    const recipients = await getBookingNotificationRecipients({
      customerId: booking.customerId,
      carrierId: booking.carrierId,
    });

    const emailTargets = [recipients.customerEmail, recipients.carrierEmail];

    await Promise.all(
      emailTargets
        .filter((email): email is string => Boolean(email))
        .map((email) =>
          sendBookingTransactionalEmail({
            bookingId: booking.id,
            bookingStatus: "cancelled",
            emailType: "pending_booking_expired",
            to: email,
            subject: `Pending booking expired: ${booking.bookingReference}`,
            html: `<p>Booking <strong>${booking.bookingReference}</strong> expired after the 2-hour carrier response window and has been cancelled. Capacity has been released back to the trip.</p>`,
          }),
        ),
    );

    expiredIds.push(row.id);
  }

  return expiredIds;
}

export async function getCarrierPayoutDashboard(userId: string) {
  const [bookings, carrierRow] = await Promise.all([
    listCarrierBookings(userId),
    createServerSupabaseClient()
      .from("carriers")
      .select("stripe_onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const upcomingExpectedPayoutCents = bookings
    .filter((booking) => ["confirmed", "picked_up", "in_transit", "delivered"].includes(booking.status))
    .reduce((sum, booking) => sum + booking.pricing.carrierPayoutCents, 0);
  const completedButUnreleasedCents = bookings
    .filter((booking) => booking.status === "completed" && booking.paymentStatus !== "captured")
    .reduce((sum, booking) => sum + booking.pricing.carrierPayoutCents, 0);
  const refundedJobs = bookings.filter((booking) =>
    ["refunded", "authorization_cancelled"].includes(booking.paymentStatus ?? "pending"),
  );
  const payoutHolds = bookings
    .flatMap((booking) => {
      if (
        booking.status === "cancelled" ||
        ["refunded", "authorization_cancelled"].includes(booking.paymentStatus ?? "pending")
      ) {
        return [];
      }

      if (booking.status === "confirmed") {
        return [
          {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            heldCents: booking.pricing.carrierPayoutCents,
            stage: "Confirmed",
            missingStep: "Pickup proof pack still missing",
            explanation:
              "Funds stay on hold while the job is still ahead of pickup. Capture pickup proof before moving the booking forward.",
            nextAction:
              "Open the trip on pickup day, upload pickup proof, and keep any exceptions inside moverrr.",
            priority: 4,
          },
        ];
      }

      if (booking.status === "picked_up" || booking.status === "in_transit") {
        return [
          {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            heldCents: booking.pricing.carrierPayoutCents,
            stage: booking.status === "picked_up" ? "Picked up" : "In transit",
            missingStep: "Delivery proof pack still missing",
            explanation:
              "The run is live, but payout cannot move until delivery proof is captured and any issues are logged in-platform.",
            nextAction:
              "Upload delivery proof at handoff and use the issue flow immediately if access, item-fit, or damage problems appear.",
            priority: 3,
          },
        ];
      }

      if (booking.status === "delivered") {
        return [
          {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            heldCents: booking.pricing.carrierPayoutCents,
            stage: "Delivered",
            missingStep: "Waiting for customer receipt confirmation",
            explanation:
              "The item was delivered, but funds stay held until the customer confirms receipt or a dispute is opened and resolved.",
            nextAction:
              "Ask the customer to confirm inside moverrr. Do not move payment or follow-up off-platform.",
            priority: 1,
          },
        ];
      }

      if (booking.status === "completed" && booking.paymentStatus === "capture_failed") {
        return [
          {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            heldCents: booking.pricing.carrierPayoutCents,
            stage: "Completed",
            missingStep: "Manual capture review required",
            explanation:
              "Completion is recorded, but Stripe capture failed. Ops needs to review the payment state before payout can release.",
            nextAction:
              "Escalate this booking through admin payments so capture can be retried or manually resolved.",
            priority: 0,
          },
        ];
      }

      if (booking.status === "completed" && booking.paymentStatus !== "captured") {
        return [
          {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            heldCents: booking.pricing.carrierPayoutCents,
            stage: "Completed",
            missingStep: "Capture still pending",
            explanation:
              "The job is complete, but payment capture has not cleared yet. That hold usually resolves after the completion flow settles.",
            nextAction:
              "If this lingers, check admin payments for capture issues before chasing the customer.",
            priority: 2,
          },
        ];
      }

      return [];
    })
    .sort((left, right) => left.priority - right.priority);
  const historyByMonth = Array.from(
    bookings
      .filter((booking) => booking.paymentStatus === "captured" || booking.paymentStatus === "refunded")
      .reduce((map, booking) => {
        const monthKey = (booking.completedAt ?? booking.updatedAt ?? booking.createdAt ?? "").slice(0, 7);
        const current = map.get(monthKey) ?? {
          month: monthKey,
          releasedCents: 0,
          refundedCents: 0,
          jobCount: 0,
        };

        if (booking.paymentStatus === "captured") {
          current.releasedCents += booking.pricing.carrierPayoutCents;
        }

        if (booking.paymentStatus === "refunded" || booking.paymentStatus === "authorization_cancelled") {
          current.refundedCents += booking.pricing.carrierPayoutCents;
        }

        current.jobCount += 1;
        map.set(monthKey, current);
        return map;
      }, new Map<string, { month: string; releasedCents: number; refundedCents: number; jobCount: number }>())
      .values(),
  ).filter((entry) => Boolean(entry.month));

  return {
    upcomingExpectedPayoutCents,
    completedButUnreleasedCents,
    refundedJobs,
    payoutSetupReady: carrierRow.data?.stripe_onboarding_complete ?? false,
    payoutHolds,
    historyByMonth,
  };
}

export async function getCarrierPerformanceStats(userId: string) {
  const [bookings, carrierRows] = await Promise.all([
    listCarrierBookings(userId),
    createServerSupabaseClient()
      .from("carriers")
      .select("id, average_rating, rating_count")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const carrierId = carrierRows.data?.id;
  const supabase = createServerSupabaseClient();
  const { data: reviews } = carrierId
    ? await supabase
        .from("reviews")
        .select("rating, created_at")
        .eq("reviewee_id", carrierId)
        .order("created_at", { ascending: true })
    : { data: [] as Array<{ rating: number; created_at: string }> };

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((booking) =>
    ["confirmed", "picked_up", "in_transit", "delivered", "completed"].includes(booking.status),
  ).length;
  const completedBookings = bookings.filter((booking) => booking.status === "completed").length;
  const disputedBookings = bookings.filter((booking) => booking.status === "disputed").length;
  const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled").length;
  const topCorridors = Array.from(
    bookings.reduce((map, booking) => {
      const key = `${booking.pickupSuburb ?? "Unknown"} -> ${booking.dropoffSuburb ?? "Unknown"}`;
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const monthlyEarnings = Array.from(
    bookings
      .filter((booking) => booking.status === "completed")
      .reduce((map, booking) => {
        const month = (booking.completedAt ?? booking.updatedAt ?? booking.createdAt ?? "").slice(0, 7);

        if (!month) {
          return map;
        }

        const current = map.get(month) ?? { month, earningsCents: 0, jobs: 0 };
        current.earningsCents += booking.pricing.carrierPayoutCents;
        current.jobs += 1;
        map.set(month, current);
        return map;
      }, new Map<string, { month: string; earningsCents: number; jobs: number }>())
      .values(),
  ).sort((left, right) => left.month.localeCompare(right.month));
  const ratingTrend = Array.from(
    (reviews ?? []).reduce((map, review) => {
      const month = review.created_at.slice(0, 7);
      const current = map.get(month) ?? { month, total: 0, count: 0 };
      current.total += review.rating;
      current.count += 1;
      map.set(month, current);
      return map;
    }, new Map<string, { month: string; total: number; count: number }>())
      .values(),
  )
    .map((entry) => ({
      month: entry.month,
      averageRating: entry.count > 0 ? Number((entry.total / entry.count).toFixed(1)) : 0,
      count: entry.count,
    }))
    .sort((left, right) => left.month.localeCompare(right.month));

  return {
    acceptanceRatePct: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0,
    completionRatePct: confirmedBookings > 0 ? Math.round((completedBookings / confirmedBookings) * 100) : 0,
    cancellationRatePct: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
    completedJobs: completedBookings,
    averageRating: Number(carrierRows.data?.average_rating ?? 0),
    ratingCount: carrierRows.data?.rating_count ?? 0,
    disputeCount: disputedBookings,
    repeatRoutes: topCorridors,
    topCorridors,
    monthlyEarnings,
    ratingTrend,
  };
}

export async function getCarrierLaneInsights(userId: string) {
  const bookings = await listCarrierBookings(userId);

  return Array.from(
    bookings
      .filter((booking) => booking.status === "completed")
      .reduce((map, booking) => {
        const key = `${booking.pickupSuburb ?? "Unknown"} -> ${booking.dropoffSuburb ?? "Unknown"}`;
        const current = map.get(key) ?? {
          corridor: key,
          jobs: 0,
          earningsCents: 0,
        };

        current.jobs += 1;
        current.earningsCents += booking.pricing.carrierPayoutCents;
        map.set(key, current);
        return map;
      }, new Map<string, { corridor: string; jobs: number; earningsCents: number }>())
      .values(),
  )
    .sort((a, b) => b.earningsCents - a.earningsCents)
    .slice(0, 3);
}
