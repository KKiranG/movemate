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
const acceptanceClaimsSql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/038_booking_request_acceptance_claims.sql"),
  "utf8",
);
const webhookSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/stripe/payment-intent-events.ts"),
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

test("carrier acceptance claims the request before capture and finalizes after capture", () => {
  const source = bookingRequestsSource.match(
    /export async function applyCarrierBookingRequestAction[\s\S]*?\n}\n$/,
  );

  assert.ok(source, "applyCarrierBookingRequestAction source should be present.");
  assert.match(source[0], /payment_authorization_missing/);
  assert.match(source[0], /claimBookingRequestAcceptance/);
  assert.match(source[0], /captureBookingRequestPaymentAuthorization/);
  assert.match(source[0], /releaseBookingRequestAcceptanceClaim/);
  assert.match(source[0], /\.rpc\("accept_booking_request_atomic"/);
  assert.ok(
    source[0].indexOf("claimBookingRequestAcceptance") <
      source[0].indexOf("captureBookingRequestPaymentAuthorization"),
    "The request/group should be claimed before Stripe capture is attempted.",
  );
  assert.ok(
    source[0].indexOf("captureBookingRequestPaymentAuthorization") <
      source[0].indexOf('.rpc("accept_booking_request_atomic"'),
    "Payment capture should happen before the request is finalized as accepted.",
  );
  assert.match(source[0], /attachCapturedAuthorizationToBooking/);
});

test("request acceptance SQL uses an accepting claim to prevent double capture races", () => {
  assert.match(acceptanceClaimsSql, /'accepting'/);
  assert.match(acceptanceClaimsSql, /create or replace function public\.claim_booking_request_acceptance_atomic/);
  assert.match(acceptanceClaimsSql, /acceptance_claim_expires_at = v_now \+ interval '5 minutes'/);
  assert.match(acceptanceClaimsSql, /fast_match_already_claimed/);
  assert.match(acceptanceClaimsSql, /create or replace function public\.release_booking_request_acceptance_claim_atomic/);
  assert.match(acceptanceClaimsSql, /if v_request\.status <> 'accepting' then/i);
  assert.match(acceptanceClaimsSql, /raise exception 'booking_request_acceptance_not_claimed'/);
});

test("request-level payment intent webhooks update request authorizations", () => {
  assert.match(webhookSource, /paymentAuthorizationId/);
  assert.match(webhookSource, /markBookingRequestPaymentAuthorizationFromWebhook/);
  assert.match(webhookSource, /marked_request_authorization_authorized/);
  assert.match(webhookSource, /marked_request_authorization_captured/);
  assert.match(webhookSource, /marked_request_authorization_cancelled/);
  assert.match(webhookSource, /marked_request_authorization_failed/);
});

test("terminal request groups cancel unused request-level authorizations", () => {
  assert.match(requestPaymentsSource, /cancelBookingRequestPaymentAuthorizationIfUnused/);
  assert.match(requestPaymentsSource, /paymentIntents\.cancel/);
  assert.match(bookingRequestsSource, /cancelUnusedRequestAuthorizationAfterTerminalRequest/);
  assert.match(bookingRequestsSource, /booking_request_declined/);
  assert.match(bookingRequestsSource, /booking_request_cancelled/);
  assert.match(bookingRequestsSource, /booking_request_expired/);
});

test("payment authorization helper uses manual capture and local-dev fallback", () => {
  assert.match(requestPaymentsSource, /capture_method: "manual"/);
  assert.match(requestPaymentsSource, /confirm: true/);
  assert.match(requestPaymentsSource, /off_session: true/);
  assert.match(requestPaymentsSource, /intent\.status !== "requires_capture"/);
  assert.match(requestPaymentsSource, /!hasStripeEnv\(\)/);
  assert.match(requestPaymentsSource, /status: "authorized"/);
});
