import { DEFAULT_DEDICATED_ESTIMATES } from "@/lib/constants";
import type { Booking, BookingEvent, BookingPriceBreakdown } from "@/types/booking";
import type { BookingRequest } from "@/types/booking-request";
import type { CarrierProfile, Vehicle } from "@/types/carrier";
import type { Database } from "@/types/database";
import type { UnmatchedRequest } from "@/types/alert";
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
      via: [],
      label: `${record.origin_suburb} → ${record.destination_suburb}`,
    },
    tripDate: record.trip_date,
    timeWindow: record.time_window,
    spaceSize: record.space_size,
    availableVolumeM3: Number(record.available_volume_m3 ?? 0),
    availableWeightKg: Number(record.available_weight_kg ?? 0),
    detourRadiusKm: Number(record.detour_radius_km),
    priceCents: record.price_cents,
    suggestedPriceCents: record.suggested_price_cents,
    dedicatedEstimateCents,
    savingsPct,
    remainingCapacityPct: record.remaining_capacity_pct,
    isReturnTrip: record.is_return_trip,
    status: record.status,
    publishAt: record.publish_at,
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
  return {
    basePriceCents: row.base_price_cents,
    stairsFeeCents: row.stairs_fee_cents,
    helperFeeCents: row.helper_fee_cents,
    bookingFeeCents: row.booking_fee_cents,
    totalPriceCents: row.total_price_cents,
    carrierPayoutCents: row.carrier_payout_cents,
    platformCommissionCents: row.platform_commission_cents,
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
      source: "legacy_booking",
      listingId: record.listing_id,
      moveRequestId: null,
      offerId: null,
      bookingRequestId: null,
      requestGroupId: null,
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
  const platformCommissionCents = Math.round(row.base_price_cents * 0.15);
  const carrierPayoutCents =
    row.base_price_cents + row.stairs_fee_cents + row.helper_fee_cents - platformCommissionCents;

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
      bookingFeeCents: row.booking_fee_cents,
      totalPriceCents: row.total_price_cents,
      carrierPayoutCents,
      platformCommissionCents,
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
