import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { createAdminClient } from "@/lib/supabase/admin";

const runIntegration =
  process.env.RUN_SUPABASE_INTEGRATION === "1" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const integrationTest = runIntegration ? test : test.skip;

const SEEDED_CARRIER_EMAIL = "carrier@example.com";
const SEEDED_CUSTOMER_EMAIL = "customer@example.com";
const SEEDED_LISTING_ID = "33333333-3333-3333-3333-333333333333";
const SEEDED_BOOKING_ID = "44444444-4444-4444-4444-444444444444";

async function getSeedContext() {
  const supabase = createAdminClient();
  const [{ data: carrier }, { data: customer }] = await Promise.all([
    supabase
      .from("carriers")
      .select("id, user_id")
      .eq("email", SEEDED_CARRIER_EMAIL)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("id, user_id")
      .eq("email", SEEDED_CUSTOMER_EMAIL)
      .maybeSingle(),
  ]);

  assert.ok(carrier?.id, "Expected seeded carrier to exist");
  assert.ok(customer?.id, "Expected seeded customer to exist");
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("carrier_id", carrier.id)
    .eq("is_active", true)
    .limit(1);
  assert.ok(vehicle?.[0]?.id, "Expected an active vehicle to exist");

  return {
    carrierId: carrier.id,
    carrierUserId: carrier.user_id,
    customerId: customer.id,
    customerUserId: customer.user_id,
    vehicleId: vehicle[0].id,
  };
}

integrationTest("atomic booking RPC only allows one winner for a full-capacity race", async (t) => {
  const supabase = createAdminClient();
  const seed = await getSeedContext();
  const testLabel = `integration-concurrency-${Date.now()}`;

  t.after(async () => {
    const { data: createdRows } = await supabase
      .from("bookings")
      .select("id")
      .ilike("item_description", `${testLabel}%`);

    if (createdRows && createdRows.length > 0) {
      await supabase.from("bookings").delete().in("id", createdRows.map((row) => row.id));
      await supabase.rpc("recalculate_listing_capacity", {
        p_listing_id: SEEDED_LISTING_ID,
      });
    }
  });

  const buildArgs = () => ({
    p_listing_id: SEEDED_LISTING_ID,
    p_customer_id: seed.customerId,
    p_carrier_id: seed.carrierId,
    p_actor_user_id: seed.customerUserId,
    p_item_description: `${testLabel}-${randomUUID()}`,
    p_item_category: "furniture",
    p_item_dimensions: "2.5m x 1m x 1m",
    p_item_weight_kg: 250,
    p_item_photo_urls: [],
    p_needs_stairs: false,
    p_needs_helper: false,
    p_special_instructions: "Integration test booking",
    p_pickup_address: "Penrith NSW 2750",
    p_pickup_suburb: "Penrith",
    p_pickup_postcode: "2750",
    p_pickup_lat: -33.7511,
    p_pickup_lng: 150.6942,
    p_pickup_access_notes: "Driveway access",
    p_pickup_contact_name: "Seed Customer",
    p_pickup_contact_phone: "+61 400 000 002",
    p_dropoff_address: "Bondi NSW 2026",
    p_dropoff_suburb: "Bondi",
    p_dropoff_postcode: "2026",
    p_dropoff_lat: -33.8915,
    p_dropoff_lng: 151.2743,
    p_dropoff_access_notes: "Street pickup",
    p_dropoff_contact_name: "Seed Customer",
    p_dropoff_contact_phone: "+61 400 000 002",
  });

  const [first, second] = await Promise.all([
    supabase.rpc("create_booking_atomic", buildArgs()),
    supabase.rpc("create_booking_atomic", buildArgs()),
  ]);

  const successes = [first, second].filter((result) => result.data && !result.error);
  const failures = [first, second].filter((result) => result.error);

  assert.equal(successes.length, 1);
  assert.equal(failures.length, 1);
  assert.match(failures[0]?.error?.message ?? "", /listing_not_bookable/);

  const { data: listing } = await supabase
    .from("capacity_listings")
    .select("remaining_capacity_pct, status")
    .eq("id", SEEDED_LISTING_ID)
    .maybeSingle();

  assert.equal(listing?.remaining_capacity_pct, 0);
  assert.equal(listing?.status, "booked_full");
});

integrationTest("open disputes block disputed bookings from reaching completed", async (t) => {
  const supabase = createAdminClient();
  const seed = await getSeedContext();
  const disputeId = randomUUID();

  t.after(async () => {
    await supabase.from("disputes").delete().eq("id", disputeId);
    await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", SEEDED_BOOKING_ID);
  });

  await supabase
    .from("bookings")
    .update({ status: "disputed" })
    .eq("id", SEEDED_BOOKING_ID);
  await supabase.from("disputes").insert({
    id: disputeId,
    booking_id: SEEDED_BOOKING_ID,
    raised_by: "customer",
    raiser_id: seed.customerId,
    category: "damage",
    description: "Integration test open dispute",
    status: "open",
    photo_urls: [],
  });

  await assert.rejects(
    () =>
      updateBookingStatusForActor({
        userId: seed.carrierUserId,
        bookingId: SEEDED_BOOKING_ID,
        nextStatus: "completed",
        actorRole: "admin",
      }),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as Error & { code?: string }).code === "dispute_not_resolved",
  );
});
