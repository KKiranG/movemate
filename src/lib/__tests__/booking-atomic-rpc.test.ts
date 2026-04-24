import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const bookingsSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/data/bookings.ts"),
  "utf8",
);
const bookingSafetySql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/011_booking_safety_p0.sql"),
  "utf8",
);
const minimumFloorSql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/035_minimum_base_price_floor.sql"),
  "utf8",
);
const requestAcceptanceSql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/037_accept_booking_request_atomic.sql"),
  "utf8",
);

function getCreateBookingForCustomerSource() {
  const match = bookingsSource.match(
    /export async function createBookingForCustomer[\s\S]*?\n}\n\nexport async function createPaymentIntentForBooking/,
  );

  assert.ok(match, "createBookingForCustomer source should be present.");
  return match[0];
}

test("booking creation still routes through the atomic RPC instead of a direct bookings insert", () => {
  const source = getCreateBookingForCustomerSource();

  assert.match(source, /\.rpc\("create_booking_atomic"/);
  assert.doesNotMatch(source, /\.from\("bookings"\)\s*\.insert\(/);
});

test("atomic booking SQL keeps the lock and capacity-recalculation protections that prevent oversells", () => {
  assert.match(bookingSafetySql, /pg_advisory_xact_lock\s*\(/);
  assert.match(
    bookingSafetySql,
    /from public\.capacity_listings\s+where id = p_listing_id\s+for update;/i,
  );
  assert.match(
    bookingSafetySql,
    /if v_listing\.status not in \('active', 'booked_partial'\) or v_listing\.remaining_capacity_pct <= 0 then\s+raise exception 'listing_not_bookable';/i,
  );
  assert.match(
    bookingSafetySql,
    /perform public\.recalculate_listing_capacity\(p_listing_id\);/i,
  );
});

test("capacity recalculation still ignores cancelled bookings when remaining capacity is recomputed", () => {
  assert.match(
    bookingSafetySql,
    /where booking\.listing_id = p_listing_id\s+and booking\.status <> 'cancelled';/i,
  );
});

test("atomic booking SQL applies the listing minimum base price floor before fees", () => {
  assert.match(
    minimumFloorSql,
    /v_base_price_cents\s*:=\s*greatest\(v_listing\.price_cents,\s*coalesce\(v_listing\.minimum_base_price_cents,\s*0\)\);/i,
  );
  assert.match(
    minimumFloorSql,
    /v_platform_fee_cents\s*:=\s*round\(v_base_price_cents \* 0\.15\);/i,
  );
  assert.match(
    minimumFloorSql,
    /v_carrier_payout_cents\s*:=\s*v_base_price_cents \+ v_stairs_fee_cents \+ v_helper_fee_cents;/i,
  );
});

test("booking request acceptance has a database-level Fast Match group guard", () => {
  assert.match(requestAcceptanceSql, /create or replace function public\.accept_booking_request_atomic/);
  assert.match(requestAcceptanceSql, /for update;/i);
  assert.match(requestAcceptanceSql, /pg_advisory_xact_lock/i);
  assert.match(requestAcceptanceSql, /fast_match_already_accepted/);
  assert.match(requestAcceptanceSql, /status = 'accepted'/);
  assert.match(requestAcceptanceSql, /status = 'revoked'/);
});
