import { createHash, randomUUID } from "node:crypto";

import { isCarrierActivationLive } from "@/lib/carrier-activation";
import { canTransitionBookingRequest } from "@/lib/status-machine";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toBookingRequest } from "@/lib/data/mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getBookingByIdForUser } from "@/lib/data/bookings";
import { getTripById } from "@/lib/data/trips";
import { sendRequestLifecycleEmail } from "@/lib/notifications";
import {
  deriveOffersForMoveRequest,
  ensureOfferForMoveRequestSelection,
  getOfferByIdForAdmin,
  getOfferByIdForMoveRequest,
  updateOfferStatus,
} from "@/lib/data/offers";
import {
  getMoveRequestByIdForAdmin,
  getMoveRequestByIdForCarrier,
  getMoveRequestByIdForCustomer,
  updateMoveRequestStatus,
} from "@/lib/data/move-requests";
import { requireCarrierProfileForUser, requireCustomerProfileForUser } from "@/lib/data/profiles";
import {
  ensureRecoveryAlertForMoveRequest,
  getUnmatchedRequestByMoveRequestId,
  markRecoveryAlertMatched,
} from "@/lib/data/unmatched-requests";
import {
  bookingRequestSchema,
  type BookingRequestActionInput,
  type BookingRequestCreateInput,
  type BookingRequestCustomerActionInput,
  type BookingRequestCustomerResponseInput,
  type BookingRequestInput,
  type FastMatchBookingRequestInput,
} from "@/lib/validation/booking-request";
import type { BookingInput } from "@/lib/validation/booking";
import type { Booking } from "@/types/booking";
import type {
  BookingRequest,
  BookingRequestEvent,
  BookingRequestStatus,
  CustomerRequestGroupSummary,
  CustomerBookingRequestCard,
} from "@/types/booking-request";
import type { CarrierRequestCard } from "@/types/carrier";
import type { Database } from "@/types/database";
import type { MoveRequest, Offer } from "@/types/move-request";
import { getBookingRequestUrgencyLabel } from "@/lib/request-presenters";

type BookingRequestRow = Database["public"]["Tables"]["booking_requests"]["Row"];
type BookingRequestEventRow =
  Database["public"]["Tables"]["booking_request_events"]["Row"];

const DECLINE_REASON_LABELS = {
  route_not_viable: "Carrier declined because the route no longer fits this trip cleanly.",
  item_not_supported: "Carrier declined because the item does not fit their supported load profile.",
  access_too_complex: "Carrier declined because the access conditions are too complex for this trip.",
  timing_not_workable: "Carrier declined because the timing window no longer works for this trip.",
  capacity_no_longer_available:
    "Carrier declined because the spare capacity is no longer available on this trip.",
} as const;

function getResponseDeadline(hours = 12) {
  const clampedHours = Math.min(24, Math.max(12, hours));
  return new Date(Date.now() + clampedHours * 60 * 60 * 1000).toISOString();
}

function getClarificationExpiry(hours = 12) {
  const clampedHours = Math.min(24, Math.max(4, hours));
  return new Date(Date.now() + clampedHours * 60 * 60 * 1000).toISOString();
}

function createBookingPayloadFromMoveRequest(moveRequest: MoveRequest, offer: Offer): BookingInput {
  return {
    listingId: offer.listingId,
    carrierId: offer.carrierId,
    itemDescription: moveRequest.item.description,
    itemCategory: moveRequest.item.category,
    itemSizeClass: moveRequest.item.sizeClass ?? undefined,
    itemWeightBand: moveRequest.item.weightBand ?? undefined,
    itemDimensions: moveRequest.item.dimensions ?? undefined,
    itemWeightKg: moveRequest.item.weightKg ?? undefined,
    itemPhotoUrls: moveRequest.item.photoUrls,
    needsStairs: moveRequest.needsStairs,
    needsHelper: moveRequest.needsHelper,
    specialInstructions: moveRequest.specialInstructions ?? undefined,
    pickupAddress: moveRequest.route.pickupAddress,
    pickupSuburb: moveRequest.route.pickupSuburb,
    pickupPostcode: moveRequest.route.pickupPostcode,
    pickupLatitude: moveRequest.route.pickupLatitude,
    pickupLongitude: moveRequest.route.pickupLongitude,
    dropoffAddress: moveRequest.route.dropoffAddress,
    dropoffSuburb: moveRequest.route.dropoffSuburb,
    dropoffPostcode: moveRequest.route.dropoffPostcode,
    dropoffLatitude: moveRequest.route.dropoffLatitude,
    dropoffLongitude: moveRequest.route.dropoffLongitude,
    pickupAccessNotes: moveRequest.route.pickupAccessNotes ?? undefined,
    dropoffAccessNotes: moveRequest.route.dropoffAccessNotes ?? undefined,
    pickupContactName: undefined,
    pickupContactPhone: undefined,
    dropoffContactName: undefined,
    dropoffContactPhone: undefined,
  };
}

function createBookingRequestHash(input: BookingInput) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function toBookingRequestEvent(row: BookingRequestEventRow): BookingRequestEvent {
  return {
    id: row.id,
    bookingRequestId: row.booking_request_id,
    moveRequestId: row.move_request_id,
    requestGroupId: row.request_group_id,
    actorRole: row.actor_role,
    actorUserId: row.actor_user_id,
    eventType: row.event_type,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  };
}

async function recordBookingRequestEvent(params: {
  bookingRequestId: string;
  moveRequestId: string;
  requestGroupId?: string | null;
  actorRole: BookingRequestEvent["actorRole"];
  actorUserId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_request_events")
    .insert({
      booking_request_id: params.bookingRequestId,
      move_request_id: params.moveRequestId,
      request_group_id: params.requestGroupId ?? null,
      actor_role: params.actorRole,
      actor_user_id: params.actorUserId ?? null,
      event_type: params.eventType,
      metadata: params.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "booking_request_event_create_failed");
  }

  return toBookingRequestEvent(data as BookingRequestEventRow);
}

async function listBookingRequestEvents(params: {
  bookingRequestId?: string;
  requestGroupId?: string | null;
}) {
  if (!hasSupabaseEnv()) {
    return [] as BookingRequestEvent[];
  }

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("booking_request_events")
    .select("*")
    .order("created_at", { ascending: true });

  if (params.bookingRequestId) {
    query = query.eq("booking_request_id", params.bookingRequestId);
  }

  if (params.requestGroupId) {
    query = query.eq("request_group_id", params.requestGroupId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 500, "booking_request_event_query_failed");
  }

  return (data ?? []).map((row) => toBookingRequestEvent(row as BookingRequestEventRow));
}

function getDeclineReasonLabel(reason: NonNullable<BookingRequestActionInput["declineReason"]>) {
  return DECLINE_REASON_LABELS[reason];
}

async function getBookingRequestNotificationRecipients(params: {
  customerId: string;
  carrierId: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return {
      customerEmail: null,
      carrierEmail: null,
    };
  }

  const supabase = createAdminClient();
  const [{ data: customerRow, error: customerError }, { data: carrierRow, error: carrierError }] =
    await Promise.all([
      supabase.from("customers").select("email").eq("id", params.customerId).maybeSingle(),
      supabase.from("carriers").select("email, business_name").eq("id", params.carrierId).maybeSingle(),
    ]);

  if (customerError) {
    throw new AppError(customerError.message, 500, "customer_notification_lookup_failed");
  }

  if (carrierError) {
    throw new AppError(carrierError.message, 500, "carrier_notification_lookup_failed");
  }

  return {
    customerEmail: customerRow?.email ?? null,
    carrierEmail: carrierRow?.email ?? null,
    carrierBusinessName: carrierRow?.business_name ?? "Matching carrier",
  };
}

function isFailedTerminalRequestStatus(status: BookingRequestStatus) {
  return ["declined", "expired", "cancelled"].includes(status);
}

async function getOpenBookingRequestsForMoveRequest(customerId: string, moveRequestId: string) {
  if (!hasSupabaseEnv()) {
    return [] as BookingRequest[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("customer_id", customerId)
    .eq("move_request_id", moveRequestId)
    .in("status", ["pending", "clarification_requested"]);

  if (error) {
    throw new AppError(error.message, 500, "booking_request_query_failed");
  }

  return (data ?? []).map((row) => toBookingRequest(row as BookingRequestRow));
}

async function updateBookingRequestById(params: {
  bookingRequestId: string;
  patch: Database["public"]["Tables"]["booking_requests"]["Update"];
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .update(params.patch)
    .eq("id", params.bookingRequestId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "booking_request_update_failed");
  }

  return toBookingRequest(data as BookingRequestRow);
}

async function attachRequestFlowToBooking(params: {
  bookingId: string;
  moveRequestId: string;
  offerId: string;
  bookingRequestId: string;
  requestGroupId?: string | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      move_request_id: params.moveRequestId,
      offer_id: params.offerId,
      booking_request_id: params.bookingRequestId,
      request_group_id: params.requestGroupId ?? null,
    })
    .eq("id", params.bookingId);

  if (error) {
    throw new AppError(error.message, 500, "booking_request_flow_attach_failed");
  }
}

async function ensureRecoveryAfterRequestFailure(bookingRequest: BookingRequest) {
  if (!isFailedTerminalRequestStatus(bookingRequest.status)) {
    return null;
  }

  const moveRequest = await getMoveRequestByIdForAdmin(bookingRequest.moveRequestId);

  if (!moveRequest) {
    return null;
  }

  if (bookingRequest.requestGroupId) {
    const groupRequests = await listBookingRequestsInGroup(bookingRequest.requestGroupId);
    const hasOutstanding = groupRequests.some((request) =>
      ["pending", "clarification_requested", "accepted", "revoked"].includes(request.status),
    );

    if (hasOutstanding) {
      return null;
    }
  }

  const recipients = await getBookingRequestNotificationRecipients({
    customerId: bookingRequest.customerId,
    carrierId: bookingRequest.carrierId,
  });

  return ensureRecoveryAlertForMoveRequest({
    moveRequest,
    notifyEmail: recipients.customerEmail,
  });
}

async function expireStaleBookingRequests() {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: expiredPendingRows, error: pendingError }, { data: expiredClarificationRows, error: clarificationError }] =
    await Promise.all([
      supabase
        .from("booking_requests")
        .update({
          status: "expired",
          expires_at: now,
        })
        .eq("status", "pending")
        .lte("response_deadline_at", now)
        .select("*"),
      supabase
        .from("booking_requests")
        .update({
          status: "expired",
          expires_at: now,
        })
        .eq("status", "clarification_requested")
        .lte("clarification_expires_at", now)
        .is("customer_response_at", null)
        .select("*"),
    ]);

  if (pendingError) {
    throw new AppError(pendingError.message, 500, "booking_request_pending_expiry_failed");
  }

  if (clarificationError) {
    throw new AppError(
      clarificationError.message,
      500,
      "booking_request_clarification_expiry_failed",
    );
  }

  const expiredRequests = [...(expiredPendingRows ?? []), ...(expiredClarificationRows ?? [])].map((row) =>
    toBookingRequest(row as BookingRequestRow),
  );

  await Promise.all(
    expiredRequests.map(async (bookingRequest) => {
      const [moveRequest, recipients] = await Promise.all([
        getMoveRequestByIdForAdmin(bookingRequest.moveRequestId),
        getBookingRequestNotificationRecipients({
          customerId: bookingRequest.customerId,
          carrierId: bookingRequest.carrierId,
        }),
      ]);

      if (moveRequest && recipients.customerEmail) {
        await sendRequestLifecycleEmail({
          bookingRequestId: bookingRequest.id,
          to: recipients.customerEmail,
          subject: `Request expired: ${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
          title: "The request window closed",
          intro:
            "This request did not convert into a booking before the response or clarification window ended.",
          routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
          itemLabel: moveRequest.item.description,
          statusLabel: "Expired",
          ctaPath: `/bookings/${bookingRequest.id}`,
          ctaLabel: "Open request detail",
          bodyLines: [
            "moverrr will carry the route into recovery alerts when the move still needs supply.",
            "You do not need to restart the request from scratch just because one window closed.",
          ],
        });
      }

      await recordBookingRequestEvent({
        bookingRequestId: bookingRequest.id,
        moveRequestId: bookingRequest.moveRequestId,
        requestGroupId: bookingRequest.requestGroupId ?? null,
        actorRole: "system",
        eventType: "expired",
        metadata: {
          expirySource:
            bookingRequest.status === "clarification_requested"
              ? "clarification_window"
              : "response_window",
        },
      });

      await ensureRecoveryAfterRequestFailure(bookingRequest);
    }),
  );
}

async function listBookingRequestsInGroup(requestGroupId: string) {
  if (!hasSupabaseEnv()) {
    return [] as BookingRequest[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("request_group_id", requestGroupId);

  if (error) {
    throw new AppError(error.message, 500, "booking_request_group_query_failed");
  }

  return (data ?? []).map((row) => toBookingRequest(row as BookingRequestRow));
}

async function revokeSiblingBookingRequests(params: {
  requestGroupId: string;
  acceptedBookingRequestId: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("booking_requests")
    .update({
      status: "revoked",
      responded_at: now,
      expires_at: now,
    })
    .eq("request_group_id", params.requestGroupId)
    .neq("id", params.acceptedBookingRequestId)
    .in("status", ["pending", "clarification_requested"])
    .select("*");

  if (error) {
    throw new AppError(error.message, 500, "booking_request_revoke_failed");
  }

  await Promise.all(
    (data ?? []).map(async (row) => {
      const revokedRequest = toBookingRequest(row as BookingRequestRow);

      if (row.offer_id) {
        await updateOfferStatus(row.offer_id, "rejected");
      }

      await recordBookingRequestEvent({
        bookingRequestId: revokedRequest.id,
        moveRequestId: revokedRequest.moveRequestId,
        requestGroupId: revokedRequest.requestGroupId ?? null,
        actorRole: "system",
        eventType: "revoked",
        metadata: {
          acceptedBookingRequestId: params.acceptedBookingRequestId,
        },
      });

      const [moveRequest, recipients] = await Promise.all([
        getMoveRequestByIdForAdmin(revokedRequest.moveRequestId),
        getBookingRequestNotificationRecipients({
          customerId: revokedRequest.customerId,
          carrierId: revokedRequest.carrierId,
        }),
      ]);

      if (moveRequest && recipients.carrierEmail) {
        await sendRequestLifecycleEmail({
          bookingRequestId: revokedRequest.id,
          to: recipients.carrierEmail,
          subject: `Fast Match closed: ${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
          title: "Another Fast Match carrier accepted first",
          intro:
            "This request closed automatically because another carrier accepted the shared Fast Match group first.",
          routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
          itemLabel: moveRequest.item.description,
          statusLabel: "Revoked",
          ctaPath: "/carrier/requests",
          ctaLabel: "Open requests",
          bodyLines: [
            "No action is required on this request now.",
            "moverrr revoked the sibling requests so the customer does not stay double-booked.",
          ],
        });
      }
    }),
  );
}

export async function createBookingRequest(params: BookingRequestInput) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = bookingRequestSchema.safeParse(params);

  if (!parsed.success) {
    throw new AppError("Booking request payload is invalid.", 400, "invalid_booking_request");
  }

  const supabase = createServerSupabaseClient();
  const insertPayload: Database["public"]["Tables"]["booking_requests"]["Insert"] = {
    move_request_id: parsed.data.moveRequestId,
    offer_id: parsed.data.offerId,
    listing_id: parsed.data.listingId,
    customer_id: parsed.data.customerId,
    carrier_id: parsed.data.carrierId,
    booking_id: parsed.data.bookingId ?? null,
    request_group_id: parsed.data.requestGroupId ?? null,
    status: parsed.data.status,
    requested_total_price_cents: parsed.data.requestedTotalPriceCents,
    response_deadline_at: parsed.data.responseDeadlineAt,
    clarification_reason: parsed.data.clarificationReason ?? null,
    clarification_message: parsed.data.clarificationMessage ?? null,
    customer_response: parsed.data.customerResponse ?? null,
    responded_at: parsed.data.respondedAt ?? null,
    expires_at: parsed.data.expiresAt ?? null,
  };

  const { data, error } = await supabase
    .from("booking_requests")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "booking_request_create_failed");
  }

  const bookingRequest = toBookingRequest(data as BookingRequestRow);

  await recordBookingRequestEvent({
    bookingRequestId: bookingRequest.id,
    moveRequestId: bookingRequest.moveRequestId,
    requestGroupId: bookingRequest.requestGroupId ?? null,
    actorRole: "customer",
    actorUserId: bookingRequest.customerId,
    eventType: bookingRequest.requestGroupId ? "fast_match_request_created" : "request_created",
    metadata: {
      status: bookingRequest.status,
      requestedTotalPriceCents: bookingRequest.requestedTotalPriceCents,
    },
  });

  return bookingRequest;
}

export async function getBookingRequestByIdForCarrier(carrierId: string, bookingRequestId: string) {
  await expireStaleBookingRequests();

  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", bookingRequestId)
    .eq("carrier_id", carrierId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "booking_request_lookup_failed");
  }

  return data ? toBookingRequest(data as BookingRequestRow) : null;
}

export async function listBookingRequestsForCarrier(carrierId: string) {
  await expireStaleBookingRequests();

  if (!hasSupabaseEnv()) {
    return [] as BookingRequest[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("carrier_id", carrierId)
    .order("response_deadline_at", { ascending: true });

  if (error) {
    throw new AppError(error.message, 500, "booking_request_query_failed");
  }

  return (data ?? []).map((row) => toBookingRequest(row as BookingRequestRow));
}

function getCarrierRequestFitLabel(offer: Offer) {
  switch (offer.fitConfidence) {
    case "likely_fits":
      return "Likely fits";
    case "review_photos":
      return "Review photos";
    case "needs_approval":
      return "Needs approval";
    default:
      return "Check fit";
  }
}

function buildAccessSummary(moveRequest: MoveRequest) {
  const parts: string[] = [];

  if (moveRequest.needsStairs) {
    parts.push("stairs");
  }

  if (moveRequest.needsHelper) {
    parts.push("helper requested");
  }

  if (moveRequest.route.pickupAccessNotes || moveRequest.route.dropoffAccessNotes) {
    parts.push("access notes added");
  }

  return parts.length > 0 ? parts.join(" · ") : "Standard access";
}

export function carrierBookingDependenciesMatch({
  carrierId,
  bookingRequest,
  offer,
  trip,
}: {
  carrierId: string;
  bookingRequest: Pick<BookingRequest, "carrierId" | "listingId" | "moveRequestId" | "offerId">;
  offer: Pick<Offer, "id" | "carrierId" | "listingId" | "moveRequestId"> | null;
  trip?: { id: string; carrier: { id: string } } | null;
}) {
  if (!offer) {
    return false;
  }

  if (bookingRequest.carrierId !== carrierId) {
    return false;
  }

  if (
    offer.id !== bookingRequest.offerId ||
    offer.carrierId !== carrierId ||
    offer.listingId !== bookingRequest.listingId ||
    offer.moveRequestId !== bookingRequest.moveRequestId
  ) {
    return false;
  }

  if (trip && (trip.id !== bookingRequest.listingId || trip.carrier.id !== carrierId)) {
    return false;
  }

  return true;
}

async function getCarrierRequestMoveAndOffer(carrierId: string, bookingRequest: BookingRequest) {
  const [moveRequest, offer] = await Promise.all([
    getMoveRequestByIdForCarrier(carrierId, bookingRequest.moveRequestId),
    getOfferByIdForMoveRequest(bookingRequest.moveRequestId, bookingRequest.offerId),
  ]);

  if (!moveRequest || !offer || !carrierBookingDependenciesMatch({ carrierId, bookingRequest, offer })) {
    return null;
  }

  return { moveRequest, offer };
}

export async function listCarrierRequestCards(userId: string) {
  const carrier = await requireCarrierProfileForUser(userId);
  const bookingRequests = await listBookingRequestsForCarrier(carrier.id);
  const activeRequests = bookingRequests.filter(
    (
      request,
    ): request is BookingRequest & {
      status: Extract<BookingRequestStatus, "pending" | "clarification_requested">;
    } => ["pending", "clarification_requested"].includes(request.status),
  );

  const cards = await Promise.all(
    activeRequests.map(async (bookingRequest) => {
      const dependencies = await getCarrierRequestMoveAndOffer(carrier.id, bookingRequest);

      if (!dependencies) {
        return null;
      }

      const { moveRequest, offer } = dependencies;

      return {
        id: bookingRequest.id,
        moveRequestId: bookingRequest.moveRequestId,
        offerId: bookingRequest.offerId,
        listingId: bookingRequest.listingId,
        bookingId: bookingRequest.bookingId ?? null,
        requestGroupId: bookingRequest.requestGroupId ?? null,
        status: bookingRequest.status,
        itemDescription: moveRequest.item.description,
        itemCategory: moveRequest.item.category,
        pickupAddress: moveRequest.route.pickupAddress,
        dropoffAddress: moveRequest.route.dropoffAddress,
        pickupSuburb: moveRequest.route.pickupSuburb,
        dropoffSuburb: moveRequest.route.dropoffSuburb,
        preferredDate: moveRequest.route.preferredDate ?? null,
        requestedTotalPriceCents: bookingRequest.requestedTotalPriceCents,
        carrierPayoutCents: offer.pricing.carrierPayoutCents,
        responseDeadlineAt: bookingRequest.responseDeadlineAt,
        urgencyLabel: getBookingRequestUrgencyLabel(bookingRequest.responseDeadlineAt),
        fitLabel: getCarrierRequestFitLabel(offer),
        fitExplanation: offer.matchExplanation,
        accessSummary: buildAccessSummary(moveRequest),
        photoCount: moveRequest.item.photoUrls.length,
        photoUrls: moveRequest.item.photoUrls,
        declineReason: null,
        clarificationReason: bookingRequest.clarificationReason ?? null,
        clarificationMessage: bookingRequest.clarificationMessage ?? null,
        typeLabel: bookingRequest.requestGroupId ? "Fast Match" : "Request to Book",
      } satisfies CarrierRequestCard;
    }),
  );

  return cards
    .filter((card): card is NonNullable<typeof card> => Boolean(card))
    .sort(
      (left, right) =>
        new Date(left.responseDeadlineAt).getTime() - new Date(right.responseDeadlineAt).getTime(),
    );
}

export async function listCarrierRecentRequestOutcomeCards(userId: string) {
  const carrier = await requireCarrierProfileForUser(userId);
  const bookingRequests = await listBookingRequestsForCarrier(carrier.id);
  const settledRequests = bookingRequests.filter((request) =>
    ["accepted", "declined", "expired", "revoked", "cancelled"].includes(request.status),
  );

  const cards = await Promise.all(
    settledRequests.slice(0, 8).map(async (bookingRequest) => {
      const dependencies = await getCarrierRequestMoveAndOffer(carrier.id, bookingRequest);

      if (!dependencies) {
        return null;
      }

      const { moveRequest } = dependencies;

      return {
        id: bookingRequest.id,
        itemDescription: moveRequest.item.description,
        routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
        status: bookingRequest.status,
        requestedTotalPriceCents: bookingRequest.requestedTotalPriceCents,
        respondedAt: bookingRequest.respondedAt ?? bookingRequest.expiresAt ?? bookingRequest.createdAt,
        typeLabel: bookingRequest.requestGroupId ? "Fast Match" : "Request to Book",
      };
    }),
  );

  return cards.filter((card): card is NonNullable<typeof card> => Boolean(card));
}

export async function getBookingRequestByIdForCustomer(userId: string, bookingRequestId: string) {
  await expireStaleBookingRequests();

  const customer = await requireCustomerProfileForUser(userId);

  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", bookingRequestId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "booking_request_lookup_failed");
  }

  return data ? toBookingRequest(data as BookingRequestRow) : null;
}

export async function listCustomerRequestCards(userId: string) {
  await expireStaleBookingRequests();

  const customer = await requireCustomerProfileForUser(userId);

  if (!hasSupabaseEnv()) {
    return [] as CustomerBookingRequestCard[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "booking_request_query_failed");
  }

  const requests = (data ?? []).map((row) => toBookingRequest(row as BookingRequestRow));
  const cards = await Promise.all(
    requests.map(async (bookingRequest) => {
      const [moveRequest, offer, trip, recoveryAlert] = await Promise.all([
        getMoveRequestByIdForCustomer(customer.id, bookingRequest.moveRequestId),
        getOfferByIdForAdmin(bookingRequest.offerId),
        getTripById(bookingRequest.listingId),
        getUnmatchedRequestByMoveRequestId(bookingRequest.moveRequestId),
      ]);

      if (!moveRequest || !offer) {
        return null;
      }

      return {
        id: bookingRequest.id,
        moveRequestId: bookingRequest.moveRequestId,
        offerId: bookingRequest.offerId,
        listingId: bookingRequest.listingId,
        bookingId: bookingRequest.bookingId ?? null,
        requestGroupId: bookingRequest.requestGroupId ?? null,
        status: bookingRequest.status,
        itemDescription: moveRequest.item.description,
        pickupSuburb: moveRequest.route.pickupSuburb,
        dropoffSuburb: moveRequest.route.dropoffSuburb,
        requestedTotalPriceCents: bookingRequest.requestedTotalPriceCents,
        responseDeadlineAt: bookingRequest.responseDeadlineAt,
        preferredDate: moveRequest.route.preferredDate ?? null,
        carrierBusinessName: trip?.carrier.businessName ?? "Matching carrier",
        fitExplanation: offer.matchExplanation,
        typeLabel: bookingRequest.requestGroupId ? "Fast Match" : "Request to Book",
        urgencyLabel: getBookingRequestUrgencyLabel(
          bookingRequest.status === "clarification_requested"
            ? bookingRequest.clarificationExpiresAt ?? bookingRequest.responseDeadlineAt
            : bookingRequest.responseDeadlineAt,
        ),
        declineReason: null,
        clarificationReason: bookingRequest.clarificationReason ?? null,
        clarificationMessage: bookingRequest.clarificationMessage ?? null,
        clarificationRequestedAt: bookingRequest.clarificationRequestedAt ?? null,
        clarificationExpiresAt: bookingRequest.clarificationExpiresAt ?? null,
        customerResponse: bookingRequest.customerResponse ?? null,
        customerResponseAt: bookingRequest.customerResponseAt ?? null,
        respondedAt: bookingRequest.respondedAt ?? null,
        expiresAt: bookingRequest.expiresAt ?? null,
        recoveryAlertId: recoveryAlert?.id ?? null,
        createdAt: bookingRequest.createdAt,
      } satisfies CustomerBookingRequestCard;
    }),
  );

  return cards.filter((card): card is NonNullable<typeof card> => Boolean(card));
}

export async function respondToBookingRequestClarification(
  userId: string,
  bookingRequestId: string,
  input: BookingRequestCustomerResponseInput,
) {
  const bookingRequest = await getBookingRequestByIdForCustomer(userId, bookingRequestId);

  if (!bookingRequest) {
    throw new AppError("Booking request not found.", 404, "booking_request_not_found");
  }

  if (bookingRequest.status !== "clarification_requested") {
    throw new AppError(
      "This request is not waiting on a clarification reply.",
      409,
      "booking_request_not_waiting_for_customer",
    );
  }

  if (bookingRequest.customerResponseAt || bookingRequest.customerResponse) {
    throw new AppError(
      "This clarification round already has a customer reply.",
      409,
      "booking_request_clarification_already_answered",
    );
  }

  if (
    bookingRequest.clarificationExpiresAt &&
    new Date(bookingRequest.clarificationExpiresAt).getTime() <= Date.now()
  ) {
    await updateBookingRequestById({
      bookingRequestId,
      patch: {
        status: "expired",
        expires_at: new Date().toISOString(),
      },
    });

    throw new AppError(
      "This clarification window already expired. Start from the next viable match instead.",
      409,
      "booking_request_clarification_expired",
    );
  }

  if ((bookingRequest.clarificationRoundCount ?? 0) > 1) {
    throw new AppError(
      "This request has already used its clarification allowance.",
      409,
      "booking_request_clarification_limit_reached",
    );
  }

  const updatedRequest = await updateBookingRequestById({
    bookingRequestId,
    patch: {
      status: "pending",
      customer_response: input.customerResponse,
      customer_response_at: new Date().toISOString(),
      response_deadline_at: getResponseDeadline(),
      clarification_expires_at: null,
    },
  });

  await recordBookingRequestEvent({
    bookingRequestId: updatedRequest.id,
    moveRequestId: updatedRequest.moveRequestId,
    requestGroupId: updatedRequest.requestGroupId ?? null,
    actorRole: "customer",
    actorUserId: updatedRequest.customerId,
    eventType: "clarification_answered",
    metadata: {
      customerResponse: input.customerResponse,
    },
  });

  return updatedRequest;
}

export async function cancelBookingRequestByCustomer(
  userId: string,
  bookingRequestId: string,
  input: BookingRequestCustomerActionInput,
) {
  void input;
  const customer = await requireCustomerProfileForUser(userId);
  const bookingRequest = await getBookingRequestByIdForCustomer(userId, bookingRequestId);

  if (!bookingRequest) {
    throw new AppError("Booking request not found.", 404, "booking_request_not_found");
  }

  if (!["pending", "clarification_requested"].includes(bookingRequest.status)) {
    throw new AppError(
      "Only open requests can be cancelled before a carrier responds.",
      409,
      "booking_request_cancel_not_allowed",
    );
  }

  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("booking_requests")
    .update({
      status: "cancelled",
      responded_at: now,
      expires_at: now,
    })
    .eq("customer_id", customer.id)
    .eq("move_request_id", bookingRequest.moveRequestId)
    .in("status", ["pending", "clarification_requested"])
    .select("*");

  if (error) {
    throw new AppError(error.message, 500, "booking_request_cancel_failed");
  }

  const cancelledRequests = (data ?? []).map((row) => toBookingRequest(row as BookingRequestRow));

  await updateMoveRequestStatus(bookingRequest.moveRequestId, "matched");

  await Promise.all(
    cancelledRequests.map(async (request) => {
      await updateOfferStatus(request.offerId, "expired");

      await recordBookingRequestEvent({
        bookingRequestId: request.id,
        moveRequestId: request.moveRequestId,
        requestGroupId: request.requestGroupId ?? null,
        actorRole: "customer",
        actorUserId: userId,
        eventType: "cancelled_by_customer",
        metadata: {
          sourceBookingRequestId: bookingRequestId,
        },
      });

      const [moveRequest, recipients] = await Promise.all([
        getMoveRequestByIdForAdmin(request.moveRequestId),
        getBookingRequestNotificationRecipients({
          customerId: request.customerId,
          carrierId: request.carrierId,
        }),
      ]);

      if (moveRequest && recipients.carrierEmail) {
        await sendRequestLifecycleEmail({
          bookingRequestId: request.id,
          to: recipients.carrierEmail,
          subject: `Request withdrawn: ${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
          title: "Customer withdrew the request",
          intro:
            "The customer cancelled this still-open request before a carrier accepted it.",
          routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
          itemLabel: moveRequest.item.description,
          statusLabel: "Cancelled",
          ctaPath: "/carrier/requests",
          ctaLabel: "Open requests",
          bodyLines: [
            "No acceptance action is needed now.",
            "moverrr closed the open request group cleanly so capacity is not held against a withdrawn move.",
          ],
        });
      }
    }),
  );

  return cancelledRequests.find((request) => request.id === bookingRequestId) ?? bookingRequest;
}

export async function listCustomerRequestTimeline(
  userId: string,
  bookingRequestId: string,
) {
  const bookingRequest = await getBookingRequestByIdForCustomer(userId, bookingRequestId);

  if (!bookingRequest) {
    return [] as BookingRequestEvent[];
  }

  return listBookingRequestEvents({ bookingRequestId: bookingRequest.id });
}

export async function getCustomerRequestGroupSummary(
  userId: string,
  requestGroupId: string,
) {
  const customer = await requireCustomerProfileForUser(userId);
  const requests = await listBookingRequestsInGroup(requestGroupId);
  const customerRequests = requests.filter((request) => request.customerId === customer.id);

  if (customerRequests.length === 0) {
    return null;
  }

  const winningRequest = customerRequests.find((request) => request.status === "accepted");
  const winningTrip = winningRequest ? await getTripById(winningRequest.listingId) : null;

  return {
    requestGroupId,
    totalRequests: customerRequests.length,
    winningBookingRequestId: winningRequest?.id ?? null,
    winningCarrierBusinessName: winningTrip?.carrier.businessName ?? null,
    liveRequestCount: customerRequests.filter((request) =>
      ["pending", "clarification_requested"].includes(request.status),
    ).length,
    revokedCount: customerRequests.filter((request) => request.status === "revoked").length,
    declinedCount: customerRequests.filter((request) => request.status === "declined").length,
    expiredCount: customerRequests.filter((request) => request.status === "expired").length,
  } satisfies CustomerRequestGroupSummary;
}

export async function createRequestToBook(userId: string, input: BookingRequestCreateInput) {
  const customer = await requireCustomerProfileForUser(userId);
  const moveRequest = await getMoveRequestByIdForCustomer(customer.id, input.moveRequestId);

  if (!moveRequest) {
    throw new AppError("Move request not found.", 404, "move_request_not_found");
  }

  const openRequests = await getOpenBookingRequestsForMoveRequest(customer.id, moveRequest.id);

  if (openRequests.length > 0) {
    throw new AppError(
      "This move request already has an active booking request. Finish that decision flow before sending another one.",
      409,
      "booking_request_already_open",
    );
  }

  const offer = await ensureOfferForMoveRequestSelection({
    moveRequest,
    offerId: input.offerId,
    listingId: input.listingId,
  });

  const bookingRequest = await createBookingRequest({
    moveRequestId: moveRequest.id,
    offerId: offer.id,
    listingId: offer.listingId,
    customerId: customer.id,
    carrierId: offer.carrierId,
    status: "pending",
    requestedTotalPriceCents: offer.pricing.totalPriceCents,
    responseDeadlineAt: getResponseDeadline(input.responseHours),
  });

  await updateMoveRequestStatus(moveRequest.id, "booking_requested");

  const recipients = await getBookingRequestNotificationRecipients({
    customerId: customer.id,
    carrierId: offer.carrierId,
  });

  if (recipients.carrierEmail) {
    await sendRequestLifecycleEmail({
      bookingRequestId: bookingRequest.id,
      to: recipients.carrierEmail,
      subject: `New request to review: ${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
      title: "A customer requested space on your trip",
      intro:
        "Review the route, fit, and access details in moverrr and decide inside the bounded response window.",
      routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
      itemLabel: moveRequest.item.description,
      statusLabel: "Pending",
      ctaPath: "/carrier/requests",
      ctaLabel: "Open requests",
      bodyLines: [
        "Use Accept, Decline, or one factual clarification round only.",
        "Keep the full decision trail in moverrr so support and payout logic stay clean later.",
      ],
    });
  }

  return {
    moveRequest,
    offer,
    bookingRequest,
  };
}

export async function createFastMatchBookingRequests(
  userId: string,
  input: FastMatchBookingRequestInput,
) {
  const customer = await requireCustomerProfileForUser(userId);
  const moveRequest = await getMoveRequestByIdForCustomer(customer.id, input.moveRequestId);

  if (!moveRequest) {
    throw new AppError("Move request not found.", 404, "move_request_not_found");
  }

  const openRequests = await getOpenBookingRequestsForMoveRequest(customer.id, moveRequest.id);

  if (openRequests.length > 0) {
    throw new AppError(
      "This move request already has an active booking request. Finish that decision flow before starting Fast Match.",
      409,
      "booking_request_already_open",
    );
  }

  const candidateOffers = input.listingIds?.length
    ? await Promise.all(
        input.listingIds.map((listingId) =>
          ensureOfferForMoveRequestSelection({
            moveRequest,
            listingId,
          }),
        ),
      )
    : await Promise.all(
        (
          await ensureFastMatchCandidates(moveRequest)
        ).map((offer) =>
          ensureOfferForMoveRequestSelection({
            moveRequest,
            listingId: offer.listingId,
          }),
        ),
      );

  const uniqueCarrierOffers = Array.from(
    new Map(candidateOffers.map((offer) => [offer.carrierId, offer])).values(),
  ).slice(0, 3);

  if (uniqueCarrierOffers.length === 0) {
    throw new AppError(
      "Fast Match needs at least one available carrier offer.",
      409,
      "fast_match_no_offers",
    );
  }

  const requestGroupId = randomUUID();
  const responseDeadlineAt = getResponseDeadline(input.responseHours);
  const bookingRequests: BookingRequest[] = [];

  for (const offer of uniqueCarrierOffers) {
    bookingRequests.push(
      await createBookingRequest({
        moveRequestId: moveRequest.id,
        offerId: offer.id,
        listingId: offer.listingId,
        customerId: customer.id,
        carrierId: offer.carrierId,
        requestGroupId,
        status: "pending",
        requestedTotalPriceCents: offer.pricing.totalPriceCents,
        responseDeadlineAt,
      }),
    );
  }

  await Promise.all(
    bookingRequests.map((bookingRequest) =>
      recordBookingRequestEvent({
        bookingRequestId: bookingRequest.id,
        moveRequestId: bookingRequest.moveRequestId,
        requestGroupId,
        actorRole: "customer",
        actorUserId: customer.id,
        eventType: "fast_match_group_opened",
        metadata: {
          requestCount: bookingRequests.length,
        },
      }),
    ),
  );

  await updateMoveRequestStatus(moveRequest.id, "booking_requested");

  await Promise.all(
    bookingRequests.map(async (bookingRequest) => {
      const recipients = await getBookingRequestNotificationRecipients({
        customerId: customer.id,
        carrierId: bookingRequest.carrierId,
      });

      if (!recipients.carrierEmail) {
        return;
      }

      await sendRequestLifecycleEmail({
        bookingRequestId: bookingRequest.id,
        to: recipients.carrierEmail,
        subject: `Fast Match request: ${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
        title: "Fast Match sent this move request to you",
        intro:
          "The customer asked moverrr to reach a few fitting carriers at once. If you accept first, the rest of the group closes automatically.",
        routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
        itemLabel: moveRequest.item.description,
        statusLabel: "Pending",
        ctaPath: "/carrier/requests",
        ctaLabel: "Open requests",
        bodyLines: [
          `You are one of up to ${bookingRequests.length} carriers in this Fast Match group.`,
          "Accept only if the route, fit, and access details look workable as stated.",
        ],
      });
    }),
  );

  return {
    moveRequest,
    requestGroupId,
    offers: uniqueCarrierOffers,
    bookingRequests,
  };
}

async function ensureFastMatchCandidates(moveRequest: MoveRequest) {
  const derivedOffers = await deriveOffersForMoveRequest(moveRequest);

  return Array.from(
    new Map(derivedOffers.map((offer) => [offer.carrierId, offer])).values(),
  ).slice(0, 3);
}

export async function applyCarrierBookingRequestAction(
  userId: string,
  bookingRequestId: string,
  input: BookingRequestActionInput,
): Promise<{ bookingRequest: BookingRequest; booking?: Booking | null }> {
  const carrier = await requireCarrierProfileForUser(userId);
  const carrierActivationStatus =
    carrier.activation_status ??
    (carrier.verification_status === "verified"
      ? "active"
      : carrier.verification_status === "submitted"
        ? "pending_review"
        : carrier.verification_status === "rejected"
          ? "rejected"
          : "activation_started");

  if (input.action === "accept" && !isCarrierActivationLive(carrierActivationStatus)) {
    throw new AppError(
      "Only active carriers can accept marketplace requests.",
      409,
      "carrier_not_active",
    );
  }

  const bookingRequest = await getBookingRequestByIdForCarrier(carrier.id, bookingRequestId);

  if (!bookingRequest) {
    throw new AppError("Booking request not found.", 404, "booking_request_not_found");
  }

  const nextStatus =
    input.action === "accept"
      ? "accepted"
      : input.action === "decline"
        ? "declined"
        : "clarification_requested";

  if (!canTransitionBookingRequest(bookingRequest.status, nextStatus)) {
    throw new AppError(
      `Booking request cannot move from ${bookingRequest.status} to ${nextStatus}.`,
      409,
      "invalid_booking_request_transition",
    );
  }

  if (input.action === "clarify") {
    if ((bookingRequest.clarificationRoundCount ?? 0) >= 1) {
      throw new AppError(
        "This request already used its single clarification round.",
        409,
        "booking_request_clarification_limit_reached",
      );
    }

    return {
      bookingRequest: await updateBookingRequestById({
        bookingRequestId,
        patch: {
          status: "clarification_requested",
          clarification_round_count: 1,
          clarification_reason: input.clarificationReason ?? null,
          clarification_requested_at: new Date().toISOString(),
          clarification_expires_at: getClarificationExpiry(),
          clarification_message: input.clarificationMessage ?? null,
          customer_response: null,
          customer_response_at: null,
          responded_at: new Date().toISOString(),
        },
      }).then(async (updatedRequest) => {
        await recordBookingRequestEvent({
          bookingRequestId: updatedRequest.id,
          moveRequestId: updatedRequest.moveRequestId,
          requestGroupId: updatedRequest.requestGroupId ?? null,
          actorRole: "carrier",
          actorUserId: userId,
          eventType: "clarification_requested",
          metadata: {
            clarificationReason: input.clarificationReason ?? null,
            message: input.clarificationMessage ?? null,
          },
        });

        return updatedRequest;
      }),
    };
  }

  if (input.action === "decline") {
    const declinedRequest = await updateBookingRequestById({
      bookingRequestId,
      patch: {
        status: "declined",
        responded_at: new Date().toISOString(),
      },
    });

    await updateOfferStatus(declinedRequest.offerId, "rejected");
    const [moveRequest, recipients] = await Promise.all([
      getMoveRequestByIdForAdmin(declinedRequest.moveRequestId),
      getBookingRequestNotificationRecipients({
        customerId: declinedRequest.customerId,
        carrierId: declinedRequest.carrierId,
      }),
    ]);

    if (moveRequest && recipients.customerEmail) {
      await sendRequestLifecycleEmail({
        bookingRequestId: declinedRequest.id,
        to: recipients.customerEmail,
        subject: `Request declined: ${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
        title: "This carrier declined the request",
        intro:
          "The request did not convert with this carrier, but moverrr can carry the move into the next recovery step.",
        routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
        itemLabel: moveRequest.item.description,
        statusLabel: "Declined",
        ctaPath: `/bookings/${declinedRequest.id}`,
        ctaLabel: "Open request detail",
        bodyLines: [
          getDeclineReasonLabel(input.declineReason!),
          "Use the request detail to see the next-best recovery path.",
          "There is no need to reopen the same negotiation off-platform.",
        ],
      });
    }

    await recordBookingRequestEvent({
      bookingRequestId: declinedRequest.id,
      moveRequestId: declinedRequest.moveRequestId,
      requestGroupId: declinedRequest.requestGroupId ?? null,
      actorRole: "carrier",
      actorUserId: userId,
      eventType: "declined",
      metadata: {
        declineReason: input.declineReason ?? null,
        declineReasonLabel: input.declineReason
          ? getDeclineReasonLabel(input.declineReason)
          : null,
      },
    });

    await ensureRecoveryAfterRequestFailure(declinedRequest);

    return {
      bookingRequest: declinedRequest,
    };
  }

  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  const moveRequest = await getMoveRequestByIdForAdmin(bookingRequest.moveRequestId);
  const offer = await getOfferByIdForAdmin(bookingRequest.offerId);

  if (!moveRequest || !offer) {
    throw new AppError("Booking request dependencies are missing.", 500, "booking_request_dependency_missing");
  }

  const bookingInput = createBookingPayloadFromMoveRequest(moveRequest, offer);
  const supabase = createAdminClient();
  const idempotencyKey = `booking-request-accept:${bookingRequest.id}`;
  const { data: bookingId, error } = await supabase.rpc("create_booking_atomic", {
    p_actor_user_id: userId,
    p_carrier_id: bookingRequest.carrierId,
    p_customer_id: bookingRequest.customerId,
    p_dropoff_access_notes: bookingInput.dropoffAccessNotes ?? null,
    p_dropoff_address: bookingInput.dropoffAddress,
    p_dropoff_contact_name: bookingInput.dropoffContactName ?? null,
    p_dropoff_contact_phone: bookingInput.dropoffContactPhone ?? null,
    p_dropoff_lat: bookingInput.dropoffLatitude,
    p_dropoff_lng: bookingInput.dropoffLongitude,
    p_dropoff_postcode: bookingInput.dropoffPostcode,
    p_dropoff_suburb: bookingInput.dropoffSuburb,
    p_item_category: bookingInput.itemCategory,
    p_item_description: bookingInput.itemDescription,
    p_item_dimensions: bookingInput.itemDimensions ?? null,
    p_item_photo_urls: bookingInput.itemPhotoUrls,
    p_item_size_class: bookingInput.itemSizeClass ?? null,
    p_item_weight_band: bookingInput.itemWeightBand ?? null,
    p_item_weight_kg: bookingInput.itemWeightKg ?? null,
    p_listing_id: bookingInput.listingId,
    p_needs_helper: bookingInput.needsHelper,
    p_needs_stairs: bookingInput.needsStairs,
    p_pickup_access_notes: bookingInput.pickupAccessNotes ?? null,
    p_pickup_address: bookingInput.pickupAddress,
    p_pickup_contact_name: bookingInput.pickupContactName ?? null,
    p_pickup_contact_phone: bookingInput.pickupContactPhone ?? null,
    p_pickup_lat: bookingInput.pickupLatitude,
    p_pickup_lng: bookingInput.pickupLongitude,
    p_pickup_postcode: bookingInput.pickupPostcode,
    p_pickup_suburb: bookingInput.pickupSuburb,
    p_special_instructions: bookingInput.specialInstructions ?? null,
    p_client_idempotency_key: idempotencyKey,
    p_idempotency_request_hash: createBookingRequestHash(bookingInput),
  });

  if (error || !bookingId) {
    throw new AppError(error?.message ?? "Could not create the accepted booking.", 500, "booking_create_failed");
  }

  await attachRequestFlowToBooking({
    bookingId,
    moveRequestId: bookingRequest.moveRequestId,
    offerId: bookingRequest.offerId,
    bookingRequestId,
    requestGroupId: bookingRequest.requestGroupId ?? null,
  });

  const acceptedRequest = await updateBookingRequestById({
    bookingRequestId,
    patch: {
      status: "accepted",
      booking_id: bookingId,
      responded_at: new Date().toISOString(),
      clarification_reason: null,
      clarification_message: null,
    },
  });

  await updateOfferStatus(acceptedRequest.offerId, "selected");
  await updateMoveRequestStatus(acceptedRequest.moveRequestId, "booked");
  await markRecoveryAlertMatched(acceptedRequest.moveRequestId);

  await recordBookingRequestEvent({
    bookingRequestId: acceptedRequest.id,
    moveRequestId: acceptedRequest.moveRequestId,
    requestGroupId: acceptedRequest.requestGroupId ?? null,
    actorRole: "carrier",
    actorUserId: userId,
    eventType: "accepted",
    metadata: {
      bookingId,
    },
  });

  const recipients = await getBookingRequestNotificationRecipients({
    customerId: acceptedRequest.customerId,
    carrierId: acceptedRequest.carrierId,
  });

  if (moveRequest && recipients.customerEmail) {
    await sendRequestLifecycleEmail({
      bookingRequestId: acceptedRequest.id,
      to: recipients.customerEmail,
      subject: `Request accepted: ${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
      title: "A carrier accepted your request",
      intro:
        "The request is now a live booking in moverrr, so proof, payment, and fulfilment updates move into the booking record.",
      routeLabel: `${moveRequest.route.pickupSuburb} to ${moveRequest.route.dropoffSuburb}`,
      itemLabel: moveRequest.item.description,
      statusLabel: "Accepted",
      ctaPath: `/bookings/${bookingId}`,
      ctaLabel: "Open booking",
      bodyLines: [
        "Use the booking record from here forward for fulfilment, proof, and disputes.",
      ],
    });
  }

  if (acceptedRequest.requestGroupId) {
    await revokeSiblingBookingRequests({
      requestGroupId: acceptedRequest.requestGroupId,
      acceptedBookingRequestId: acceptedRequest.id,
    });
  }

  return {
    bookingRequest: acceptedRequest,
    booking: await getBookingByIdForUser(userId, bookingId),
  };
}
