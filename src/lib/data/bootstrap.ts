import { demoBookings, demoTrips } from "@/lib/demo-data";
import { getSmokeBootstrapSecret, hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { toGeographyPoint } from "@/lib/data/mappers";
import { secureCompare } from "@/lib/server/utils";

export async function bootstrapSmokeDataset(secret: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }

  if (!getSmokeBootstrapSecret() || !secureCompare(secret, getSmokeBootstrapSecret())) {
    throw new AppError("Invalid bootstrap secret.", 403, "forbidden");
  }

  const supabase = createAdminClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  let bootstrappedTrips = 0;
  let bootstrappedBookings = 0;

  for (const trip of demoTrips) {
    const { data: existingCarrier } = await supabase
      .from("carriers")
      .select("id")
      .eq("email", trip.carrier.email)
      .maybeSingle();

    if (!existingCarrier) {
      continue;
    }

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id")
      .eq("carrier_id", existingCarrier.id)
      .limit(1)
      .maybeSingle();

    if (!vehicle) {
      continue;
    }

    await supabase.from("capacity_listings").upsert(
      {
        id: trip.id,
        carrier_id: existingCarrier.id,
        vehicle_id: vehicle.id,
        origin_suburb: trip.route.originSuburb,
        origin_postcode: trip.route.originPostcode ?? "2000",
        origin_point: toGeographyPoint(
          trip.route.originLongitude ?? 151.2093,
          trip.route.originLatitude ?? -33.8688,
        ),
        destination_suburb: trip.route.destinationSuburb,
        destination_postcode: trip.route.destinationPostcode ?? "2000",
        destination_point: toGeographyPoint(
          trip.route.destinationLongitude ?? 151.2093,
          trip.route.destinationLatitude ?? -33.8688,
        ),
        trip_date: trip.tripDate,
        time_window: trip.timeWindow,
        space_size: trip.spaceSize,
        available_volume_m3: trip.availableVolumeM3,
        available_weight_kg: trip.availableWeightKg,
        detour_radius_km: trip.detourRadiusKm,
        price_cents: trip.priceCents,
        suggested_price_cents: trip.suggestedPriceCents ?? null,
        accepts_furniture: trip.rules.accepts.includes("furniture"),
        accepts_boxes: trip.rules.accepts.includes("boxes"),
        accepts_appliances: trip.rules.accepts.includes("appliance"),
        accepts_fragile: trip.rules.accepts.includes("fragile"),
        stairs_ok: trip.rules.stairsOk,
        stairs_extra_cents: trip.rules.stairsExtraCents,
        helper_available: trip.rules.helperAvailable,
        helper_extra_cents: trip.rules.helperExtraCents,
        special_notes: trip.rules.specialNotes ?? null,
        remaining_capacity_pct: trip.remainingCapacityPct,
        status: trip.status ?? "active",
      },
      { onConflict: "id" },
    );
    bootstrappedTrips += 1;
  }

  if (customer) {
    for (const booking of demoBookings) {
      const matchingTrip = demoTrips.find((trip) => trip.id === booking.listingId);

      if (!matchingTrip) {
        continue;
      }

      const { data: existingCarrier } = await supabase
        .from("carriers")
        .select("id")
        .eq("email", matchingTrip.carrier.email)
        .maybeSingle();

      if (!existingCarrier) {
        continue;
      }

      await supabase.from("bookings").upsert(
        {
          id: booking.id,
          listing_id: booking.listingId,
          customer_id: customer.id,
          carrier_id: existingCarrier.id,
          item_description: booking.itemDescription,
          item_category: booking.itemCategory,
          item_photo_urls: booking.itemPhotoUrls,
          needs_stairs: booking.needsStairs,
          needs_helper: booking.needsHelper,
          pickup_address: booking.pickupAddress,
          pickup_suburb: booking.pickupSuburb ?? matchingTrip.route.originSuburb,
          pickup_postcode: booking.pickupPostcode ?? matchingTrip.route.originPostcode ?? "2000",
          pickup_point: toGeographyPoint(
            matchingTrip.route.originLongitude ?? 151.2093,
            matchingTrip.route.originLatitude ?? -33.8688,
          ),
          dropoff_address: booking.dropoffAddress,
          dropoff_suburb: booking.dropoffSuburb ?? matchingTrip.route.destinationSuburb,
          dropoff_postcode:
            booking.dropoffPostcode ?? matchingTrip.route.destinationPostcode ?? "2000",
          dropoff_point: toGeographyPoint(
            matchingTrip.route.destinationLongitude ?? 151.2093,
            matchingTrip.route.destinationLatitude ?? -33.8688,
          ),
          base_price_cents: booking.pricing.basePriceCents,
          stairs_fee_cents: booking.pricing.stairsFeeCents,
          helper_fee_cents: booking.pricing.helperFeeCents,
          booking_fee_cents: booking.pricing.bookingFeeCents,
          total_price_cents: booking.pricing.totalPriceCents,
          carrier_payout_cents: booking.pricing.carrierPayoutCents,
          platform_commission_cents: booking.pricing.platformCommissionCents,
          payment_status: "authorized",
          status: booking.status,
        },
        { onConflict: "id" },
      );
      bootstrappedBookings += 1;
    }
  }

  return {
    trips: bootstrappedTrips,
    bookings: bootstrappedBookings,
  };
}
