import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const bookingRequestsSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/data/booking-requests.ts"),
  "utf8",
);
const requestPaymentsSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/data/booking-request-payments.ts"),
  "utf8",
);
const requestPaymentSql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/036_booking_request_payment_authorizations.sql"),
  "utf8",
);

test("booking requests persist request-level payment authorizations", () => {
  assert.match(requestPaymentSql, /create table if not exists public\.booking_request_payment_authorizations/);
  assert.match(requestPaymentSql, /stripe_payment_intent_id text unique/);
  assert.match(requestPaymentSql, /status in \(/);
  assert.match(requestPaymentSql, /'authorized'/);
  assert.match(requestPaymentSql, /'captured'/);
  assert.match(requestPaymentSql, /add column if not exists payment_authorization_id/);
});

test("Request to Book creates authorization before inserting the carrier request", () => {
  const source = bookingRequestsSource.match(
    /export async function createRequestToBook[\s\S]*?\n}\n\nexport async function createFastMatchBookingRequests/,
  );

  assert.ok(source, "createRequestToBook source should be present.");
  assert.match(source[0], /createBookingRequestPaymentAuthorization/);
  assert.match(source[0], /paymentAuthorizationId: paymentAuthorization\.id/);
  assert.ok(
    source[0].indexOf("createBookingRequestPaymentAuthorization") <
      source[0].indexOf("createBookingRequest({"),
    "Request to Book authorization should be created before the request row.",
  );
});

test("Fast Match shares one authorization across sibling requests", () => {
  const source = bookingRequestsSource.match(
    /export async function createFastMatchBookingRequests[\s\S]*?\n}\n\nasync function ensureFastMatchCandidates/,
  );

  assert.ok(source, "createFastMatchBookingRequests source should be present.");
  assert.match(source[0], /requestGroupId/);
  assert.match(source[0], /Math\.max\(/);
  assert.match(source[0], /paymentAuthorizationId: paymentAuthorization\.id/);
  assert.equal(
    (source[0].match(/createBookingRequestPaymentAuthorization/g) ?? []).length,
    1,
    "Fast Match should create exactly one shared authorization for the group.",
  );
});

test("carrier acceptance captures authorization before atomic request acceptance", () => {
  const source = bookingRequestsSource.match(
    /export async function applyCarrierBookingRequestAction[\s\S]*?\n}\n$/,
  );

  assert.ok(source, "applyCarrierBookingRequestAction source should be present.");
  assert.match(source[0], /payment_authorization_missing/);
  assert.match(source[0], /captureBookingRequestPaymentAuthorization/);
  assert.match(source[0], /\.rpc\("accept_booking_request_atomic"/);
  assert.ok(
    source[0].indexOf("captureBookingRequestPaymentAuthorization") <
      source[0].indexOf('.rpc("accept_booking_request_atomic"'),
    "Payment capture should happen before the request is accepted.",
  );
  assert.match(source[0], /attachCapturedAuthorizationToBooking/);
});

test("payment authorization helper uses manual capture and local-dev fallback", () => {
  assert.match(requestPaymentsSource, /capture_method: "manual"/);
  assert.match(requestPaymentsSource, /confirm: true/);
  assert.match(requestPaymentsSource, /off_session: true/);
  assert.match(requestPaymentsSource, /intent\.status !== "requires_capture"/);
  assert.match(requestPaymentsSource, /!hasStripeEnv\(\)/);
  assert.match(requestPaymentsSource, /status: "authorized"/);
});
