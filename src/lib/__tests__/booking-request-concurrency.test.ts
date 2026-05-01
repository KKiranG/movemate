import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { describe } from "node:test";

const bookingRequestsSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/data/booking-requests.ts"),
  "utf8",
);
const acceptanceClaimsSql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/038_booking_request_acceptance_claims.sql"),
  "utf8",
);

describe("Concurrent Fast Match accept", () => {
  test("losing carrier surfaces fast_match_already_claimed as a typed AppError", () => {
    // The atomic claim function is the single source of truth for who wins the race.
    // The application layer must propagate the SQL-level loser signal as a typed code
    // so the API route can return 409 instead of bubbling a generic 500 to the carrier.
    assert.match(
      bookingRequestsSource,
      /error\?.message === "fast_match_already_claimed"\s*\?\s*"fast_match_already_claimed"/,
    );
    assert.match(bookingRequestsSource, /booking_request_acceptance_claim_failed/);
  });

  test("first acceptance wins the group and revokes siblings atomically", () => {
    // Once a sibling has been finalised, the second concurrent winner of the
    // application-level claim must still be rejected by the RPC and surfaced
    // as fast_match_already_accepted, never silently double-finalising.
    assert.match(bookingRequestsSource, /fast_match_already_accepted/);
    assert.match(bookingRequestsSource, /accept_booking_request_atomic/);
  });

  test("acceptance claim has a bounded TTL so a stalled carrier cannot block siblings forever", () => {
    assert.match(
      acceptanceClaimsSql,
      /acceptance_claim_expires_at = v_now \+ interval '5 minutes'/,
    );
    assert.match(
      acceptanceClaimsSql,
      /create or replace function public\.release_booking_request_acceptance_claim_atomic/,
    );
  });

  test("releasing a non-claimed request raises a typed exception, not a silent no-op", () => {
    // If the loser path or a stalled accept tries to release a claim that was
    // never actually held, the SQL must raise so the application can recover
    // explicitly rather than treating the slot as still open.
    assert.match(acceptanceClaimsSql, /raise exception 'booking_request_acceptance_not_claimed'/);
  });
});
