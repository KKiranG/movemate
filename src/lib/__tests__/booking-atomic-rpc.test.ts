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
