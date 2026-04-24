import { DEFAULT_DEDICATED_ESTIMATES } from "@/lib/constants";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import type { Booking, BookingEvent, BookingPriceBreakdown } from "@/types/booking";
import type { BookingRequest } from "@/types/booking-request";
import type { CarrierProfile, Vehicle } from "@/types/carrier";
import type { Database } from "@/types/database";
import type { CustomerConciergeOffer, UnmatchedRequest } from "@/types/alert";
import type { MoveRequest, Offer } from "@/types/move-request";
import type { Trip, TripSearchResult } from "@/types/trip";

type CarrierRow = Database["public"]["Tables"]["carriers"]["Row"];
type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
type ListingRow = Database["public"]["Tables"]["capacity_listings"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingEventRow = Database["public"]["Tables"]["booking_events"]["Row"];
type MoveRequestRow = Database["public"]["Tables"]["move_requests"]["Row"];
type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
type BookingRequestRow = Database["public"]["Tables"]["booking_requests"]["Row"];
type UnmatchedRequestRow = Database["public"]["Tables"]["unmatched_requests"]["Row"];
type ConciergeOfferRow = Database["public"]["Tables"]["concierge_offers"]["Row"];

export interface ListingJoinedRecord extends ListingRow {
  carrier: CarrierRow | null;
  vehicle: VehicleRow | null;
}

export interface BookingJoinedRecord extends BookingRow {
  events?: BookingEventRow[] | null;
}

function parsePoint(
  point: unknown,
): { latitude?: number; longitude?: number } {
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
      longitude:
        typeof coordinates[0] === "number" ? coordinates[0] : undefined,
      latitude:
        typeof coordinates[1] === "number" ? coordinates[1] : undefined,
    };
  }

  return {};
}

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

function deriveCarrierActivationStatus(row: CarrierRow) {
  if ("activation_status" in row && typeof row.activation_status === "string" && row.activation_status) {
    return row.activation_status;
  }

  if (row.verification_status === "verified") {
    return "active" as const;
  }

  if (row.verification_status === "submitted") {
    return "pending_review" as const;
  }

  if (row.verification_status === "rejected") {
    return "rejected" as const;
  }

  if (
    row.onboarding_completed_at ||
    row.verification_submitted_at ||
    (row.business_name?.trim() ?? "").length > 0
  ) {
    return "activation_started" as const;
  }

  return "not_started" as const;
}

export function toCarrierProfile(row: CarrierRow): CarrierProfile {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    abn: row.abn ?? undefined,
    bio: row.bio ?? undefined,
    licencePhotoUrl: row.licence_photo_url,
    insurancePhotoUrl: row.insurance_photo_url,
    vehiclePhotoUrl: row.vehicle_photo_url,
    isVerified: row.is_verified,
    verificationStatus: row.verification_status,
    activationStatus: deriveCarrierActivationStatus(row),
    abnVerified: Boolean((row as CarrierRow & { abn_verified?: boolean }).abn_verified ?? row.abn),
    insuranceVerified: Boolean(
      (row as CarrierRow & { insurance_verified?: boolean }).insurance_verified ?? row.insurance_photo_url,
    ),
    verificationSubmittedAt: row.verification_submitted_at,
    verifiedAt: row.verified_at,
    verificationNotes: row.verification_notes,
    internalNotes: row.internal_notes,
    internalTags: row.internal_tags ?? [],
    licenceExpiryDate: row.licence_expiry_date,
    insuranceExpiryDate: row.insurance_expiry_date,
    averageRating: Number(row.average_rating ?? 0),
    ratingCount: row.rating_count,
    serviceSuburbs: row.service_suburbs ?? [],
    stripeAccountId: row.stripe_account_id,
    stripeOnboardingComplete: row.stripe_onboarding_complete,
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    carrierId: row.carrier_id,
    type: row.type,
    make: row.make ?? undefined,
    model: row.model ?? undefined,
    maxVolumeM3: Number(row.max_volume_m3 ?? 0),
    maxWeightKg: Number(row.max_weight_kg ?? 0),
    hasTailgate: row.has_tailgate,
    hasBlankets: row.has_blankets,
    hasStraps: row.has_straps,
    photoUrls: row.photo_urls ?? [],
    regoPlate: row.rego_plate,
    regoState: row.rego_state,
    isActive: row.is_active,
  };
}

export function toTrip(record: ListingJoinedRecord): Trip {
  const origin = parsePoint(record.origin_point);
  const destination = parsePoint(record.destination_point);
  const carrier = record.carrier ? toCarrierProfile(record.carrier) : null;
  const vehicle = record.vehicle ? toVehicle(record.vehicle) : null;

  if (!carrier || !vehicle) {
    throw new Error("Trip record is missing carrier or vehicle data.");
  }

  const dedicatedEstimateCents =
    DEFAULT_DEDICATED_ESTIMATES[record.space_size] ??
    Math.max(record.price_cents * 2, 12000);
  const savingsPct =
    dedicatedEstimateCents > 0
      ? Math.round(((dedicatedEstimateCents - record.price_cents) / dedicatedEstimateCents) * 100)
      : 0;

  return {
    id: record.id,
    flow: {
      source: "legacy_listing",
      listingId: record.id,
      moveRequestId: null,
      offerId: null,
    },
    carrier,
    vehicle,
    route: {
      originSuburb: record.origin_suburb,
      originPostcode: record.origin_postcode,
      originLatitude: origin.latitude,
      originLongitude: origin.longitude,
      destinationSuburb: record.destination_suburb,
      destinationPostcode: record.destination_postcode,
      destinationLatitude: destination.latitude,
      destinationLongitude: destination.longitude,
      waypoints: parseStringArray("waypoint_suburbs" in record ? record.waypoint_suburbs : []).map((suburb) => ({
        suburb,
      })),
      via: parseStringArray("waypoint_suburbs" in record ? record.waypoint_suburbs : []),
      polyline: "route_polyline" in record ? record.route_polyline : null,
      label: `${record.origin_suburb} → ${record.destination_suburb}`,
    },
    tripDate: record.trip_date,
    timeWindow: record.time_window,
    spaceSize: record.space_size,
    availableVolumeM3: Number(record.available_volume_m3 ?? 0),
    availableWeightKg: Number(record.available_weight_kg ?? 0),
    detourRadiusKm: Number(record.detour_radius_km),
    detourTolerance:
      "detour_tolerance_label" in record && record.detour_tolerance_label
        ? record.detour_tolerance_label
        : "standard",
    priceCents: record.price_cents,
    minimumBasePriceCents:
      "minimum_base_price_cents" in record
        ? Number(record.minimum_base_price_cents ?? 0)
        : 0,
    suggestedPriceCents: record.suggested_price_cents,
    dedicatedEstimateCents,
    savingsPct,
    remainingCapacityPct: record.remaining_capacity_pct,
    isReturnTrip: record.is_return_trip,
    status: record.status,
    checkin24hConfirmed: "checkin_24h_confirmed" in record ? record.checkin_24h_confirmed : undefined,
    checkin24hRequestedAt:
      "checkin_24h_requested_at" in record ? record.checkin_24h_requested_at : undefined,
    checkin2hConfirmed: "checkin_2h_confirmed" in record ? record.checkin_2h_confirmed : undefined,
    checkin2hRequestedAt:
      "checkin_2h_requested_at" in record ? record.checkin_2h_requested_at : undefined,
    freshnessSuspendedAt:
      "freshness_suspended_at" in record ? record.freshness_suspended_at : undefined,
    freshnessMissCount:
      "freshness_miss_count" in record ? Number(record.freshness_miss_count ?? 0) : undefined,
    freshnessLastAction:
      "freshness_last_action" in record ? record.freshness_last_action : undefined,
    freshnessSuspensionReason:
      "freshness_suspension_reason" in record ? record.freshness_suspension_reason : undefined,
    lastFreshnessConfirmedAt:
      "last_freshness_confirmed_at" in record ? record.last_freshness_confirmed_at : undefined,
    lastFreshnessUnsuspendedAt:
      "last_freshness_unsuspended_at" in record ? record.last_freshness_unsuspended_at : undefined,
    publishAt: record.publish_at,
    recurrence: {
      rule: "recurrence_rule" in record ? record.recurrence_rule : null,
      days: parseStringArray("recurrence_days" in record ? record.recurrence_days : []),
    },
    rules: {
      accepts: [
        ...(record.accepts_furniture ? ["furniture" as const] : []),
        ...(record.accepts_boxes ? ["boxes" as const] : []),
        ...(record.accepts_appliances ? ["appliance" as const] : []),
        ...(record.accepts_fragile ? ["fragile" as const] : []),
      ],
      stairsOk: record.stairs_ok,
      stairsExtraCents: record.stairs_extra_cents,
      helperAvailable: record.helper_available,
      helperExtraCents: record.helper_extra_cents,
      specialNotes: record.special_notes ?? undefined,
    },
  };
}

export function toTripSearchResult(
  trip: Trip,
  score: number,
  breakdown?: TripSearchResult["breakdown"],
): TripSearchResult {
  return {
    ...trip,
    matchScore: score,
    breakdown:
      breakdown ??
      {
        routeFit: 0,
        destinationFit: 0,
        reliability: 0,
        priceFit: 0,
        pickupDistanceKm: undefined,
        dropoffDistanceKm: undefined,
      },
  };
}

export function toBookingPriceBreakdown(
  row: BookingRow,
): BookingPriceBreakdown {
  const derived = calculateBookingBreakdown({
    basePriceCents: row.base_price_cents,
    needsStairs: row.stairs_fee_cents > 0,
    stairsExtraCents: row.stairs_fee_cents,
    needsHelper: row.helper_fee_cents > 0,
    helperExtraCents: row.helper_fee_cents,
    adjustmentFeeCents:
      "adjustment_fee_cents" in row && typeof row.adjustment_fee_cents === "number"
        ? row.adjustment_fee_cents
        : 0,
  });

  return {
    basePriceCents: row.base_price_cents,
    stairsFeeCents: row.stairs_fee_cents,
    helperFeeCents: row.helper_fee_cents,
    adjustmentFeeCents:
      "adjustment_fee_cents" in row && typeof row.adjustment_fee_cents === "number"
        ? row.adjustment_fee_cents
        : 0,
    platformFeeCents: row.platform_commission_cents,
    gstCents: "gst_cents" in row && typeof row.gst_cents === "number" ? row.gst_cents : derived.gstCents,
    totalPriceCents: row.total_price_cents,
    carrierPayoutCents: row.carrier_payout_cents,
    platformCommissionCents: row.platform_commission_cents,
    bookingFeeCents: row.booking_fee_cents,
  };
}

export function toBookingEvent(row: BookingEventRow): BookingEvent {
  return {
    id: row.id,
    bookingId: row.booking_id,
    eventType: row.event_type,
    actorRole: row.actor_role,
    actorUserId: row.actor_user_id,
    metadata:
      typeof row.metadata === "object" && row.metadata !== null
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  };
}

export function toBooking(record: BookingJoinedRecord): Booking {
  return {
    id: record.id,
    bookingReference: record.booking_reference ?? record.id.slice(0, 8).toUpperCase(),
    listingId: record.listing_id,
    flow: {
      source:
        "booking_request_id" in record && typeof record.booking_request_id === "string"
          ? "booking_request"
          : "legacy_booking",
      listingId: record.listing_id,
      moveRequestId: "move_request_id" in record ? record.move_request_id : null,
      offerId: "offer_id" in record ? record.offer_id : null,
      bookingRequestId: "booking_request_id" in record ? record.booking_request_id : null,
      requestGroupId: "request_group_id" in record ? record.request_group_id : null,
    },
    carrierId: record.carrier_id,
    customerId: record.customer_id,
    itemDescription: record.item_description,
    itemCategory: record.item_category,
    itemSizeClass: record.item_size_class,
    itemWeightBand: record.item_weight_band,
    itemDimensions: record.item_dimensions,
    itemWeightKg: record.item_weight_kg,
    itemPhotoUrls: record.item_photo_urls ?? [],
    pickupAddress: record.pickup_address,
    pickupSuburb: record.pickup_suburb,
    pickupPostcode: record.pickup_postcode,
    dropoffAddress: record.dropoff_address,
    dropoffSuburb: record.dropoff_suburb,
    dropoffPostcode: record.dropoff_postcode,
    pickupAccessNotes: record.pickup_access_notes,
    dropoffAccessNotes: record.dropoff_access_notes,
    needsStairs: record.needs_stairs,
    needsHelper: record.needs_helper,
    status: record.status,
    pricing: toBookingPriceBreakdown(record),
    paymentStatus: record.payment_status,
    paymentFailureCode: record.payment_failure_code,
    paymentFailureReason: record.payment_failure_reason,
    stripePaymentIntentId: record.stripe_payment_intent_id,
    pickupProofPhotoUrl: record.pickup_proof_photo_url,
    deliveryProofPhotoUrl: record.delivery_proof_photo_url,
    deliveredAt: record.delivered_at,
    completedAt: record.completed_at,
    customerConfirmedAt: record.customer_confirmed_at,
    cancelledAt: record.cancelled_at,
    cancellationReason: record.cancellation_reason,
    cancellationReasonCode: record.cancellation_reason_code,
    pendingExpiresAt: record.pending_expires_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    events: (record.events ?? []).map(toBookingEvent),
  };
}

export function toMoveRequest(row: MoveRequestRow): MoveRequest {
  const pickup = parsePoint(row.pickup_point);
  const dropoff = parsePoint(row.dropoff_point);

  return {
    id: row.id,
    customerId: row.customer_id,
    status: row.status,
    item: {
      description: row.item_description,
      category: row.item_category,
      sizeClass: row.item_size_class,
      weightBand: row.item_weight_band,
      dimensions: row.item_dimensions,
      weightKg: row.item_weight_kg,
      photoUrls: row.item_photo_urls ?? [],
    },
    route: {
      pickupAddress: row.pickup_address,
      pickupSuburb: row.pickup_suburb,
      pickupPostcode: row.pickup_postcode,
      pickupLatitude: pickup.latitude ?? 0,
      pickupLongitude: pickup.longitude ?? 0,
      pickupAccessNotes: row.pickup_access_notes,
      dropoffAddress: row.dropoff_address,
      dropoffSuburb: row.dropoff_suburb,
      dropoffPostcode: row.dropoff_postcode,
      dropoffLatitude: dropoff.latitude ?? 0,
      dropoffLongitude: dropoff.longitude ?? 0,
      dropoffAccessNotes: row.dropoff_access_notes,
      preferredDate: row.preferred_date,
      preferredTimeWindow: row.preferred_time_window,
    },
    needsStairs: row.needs_stairs,
    needsHelper: row.needs_helper,
    specialInstructions: row.special_instructions,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toOffer(row: OfferRow): Offer {
  const derived = calculateBookingBreakdown({
    basePriceCents: row.base_price_cents,
    needsStairs: row.stairs_fee_cents > 0,
    stairsExtraCents: row.stairs_fee_cents,
    needsHelper: row.helper_fee_cents > 0,
    helperExtraCents: row.helper_fee_cents,
  });

  return {
    id: row.id,
    moveRequestId: row.move_request_id,
    listingId: row.listing_id,
    carrierId: row.carrier_id,
    status: row.status,
    matchClass: row.match_class,
    fitConfidence: row.fit_confidence,
    matchExplanation: row.match_explanation,
    rankingScore: row.ranking_score,
    pickupDistanceKm: row.pickup_distance_km,
    dropoffDistanceKm: row.dropoff_distance_km,
    detourDistanceKm: row.detour_distance_km,
    pricing: {
      basePriceCents: row.base_price_cents,
      stairsFeeCents: row.stairs_fee_cents,
      helperFeeCents: row.helper_fee_cents,
      adjustmentFeeCents: 0,
      platformFeeCents:
        "platform_fee_cents" in row && typeof row.platform_fee_cents === "number"
          ? row.platform_fee_cents
          : derived.platformFeeCents,
      gstCents:
        "gst_cents" in row && typeof row.gst_cents === "number"
          ? row.gst_cents
          : derived.gstCents,
      totalPriceCents: row.total_price_cents,
      carrierPayoutCents: derived.carrierPayoutCents,
      platformCommissionCents: derived.platformCommissionCents,
      bookingFeeCents: row.booking_fee_cents,
    },
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function toBookingRequest(row: BookingRequestRow): BookingRequest {
  return {
    id: row.id,
    moveRequestId: row.move_request_id,
    offerId: row.offer_id,
    listingId: row.listing_id,
    customerId: row.customer_id,
    carrierId: row.carrier_id,
    bookingId: row.booking_id,
    requestGroupId: row.request_group_id,
    paymentAuthorizationId: row.payment_authorization_id,
    status: row.status,
    requestedTotalPriceCents: row.requested_total_price_cents,
    responseDeadlineAt: row.response_deadline_at,
    clarificationRoundCount: row.clarification_round_count,
    clarificationReason: row.clarification_reason,
    clarificationRequestedAt: row.clarification_requested_at,
    clarificationExpiresAt: row.clarification_expires_at,
    clarificationMessage: row.clarification_message,
    customerResponse: row.customer_response,
    customerResponseAt: row.customer_response_at,
    acceptanceClaimedAt: row.acceptance_claimed_at,
    acceptanceClaimExpiresAt: row.acceptance_claim_expires_at,
    respondedAt: row.responded_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toUnmatchedRequest(row: UnmatchedRequestRow): UnmatchedRequest {
  const pickup = parsePoint(row.pickup_point);
  const dropoff = parsePoint(row.dropoff_point);

  return {
    id: row.id,
    customerId: row.customer_id,
    moveRequestId: row.move_request_id,
    status: row.status,
    pickupSuburb: row.pickup_suburb,
    pickupPostcode: row.pickup_postcode,
    pickupLatitude: pickup.latitude ?? 0,
    pickupLongitude: pickup.longitude ?? 0,
    dropoffSuburb: row.dropoff_suburb,
    dropoffPostcode: row.dropoff_postcode,
    dropoffLatitude: dropoff.latitude ?? 0,
    dropoffLongitude: dropoff.longitude ?? 0,
    itemCategory: row.item_category,
    itemDescription: row.item_description,
    preferredDate: row.preferred_date,
    notifyEmail: row.notify_email,
    lastNotifiedAt: row.last_notified_at,
    notificationCount: row.notification_count,
    matchedAt: row.matched_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCustomerConciergeOffer(params: {
  row: ConciergeOfferRow;
  carrierBusinessName?: string | null;
  tripDate?: string | null;
  timeWindow?: string | null;
}): CustomerConciergeOffer {
  return {
    id: params.row.id,
    unmatchedRequestId: params.row.unmatched_request_id,
    moveRequestId: params.row.move_request_id,
    listingId: params.row.listing_id,
    offerId: params.row.offer_id,
    bookingRequestId: params.row.booking_request_id,
    carrierId: params.row.carrier_id,
    carrierBusinessName: params.carrierBusinessName ?? "Matching carrier",
    quotedTotalPriceCents: params.row.quoted_total_price_cents,
    status: params.row.status,
    note: params.row.note,
    tripDate: params.tripDate ?? null,
    timeWindow: params.timeWindow ?? null,
    sentAt: params.row.sent_at,
    respondedAt: params.row.responded_at,
    createdAt: params.row.created_at,
    updatedAt: params.row.updated_at,
  };
}

export function toOfferTripFlowCompatibility(row: Pick<OfferRow, "id" | "listing_id" | "move_request_id">) {
  return {
    source: "offer" as const,
    listingId: row.listing_id,
    moveRequestId: row.move_request_id,
    offerId: row.id,
  };
}

export function toBookingRequestFlowCompatibility(
  row: Pick<BookingRequestRow, "id" | "listing_id" | "move_request_id" | "offer_id" | "request_group_id">,
) {
  return {
    source: "booking_request" as const,
    listingId: row.listing_id,
    moveRequestId: row.move_request_id,
    offerId: row.offer_id,
    bookingRequestId: row.id,
    requestGroupId: row.request_group_id,
  };
}

export function toGeographyPoint(longitude: number, latitude: number) {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}
