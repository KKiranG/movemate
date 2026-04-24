import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { carrierBookingDependenciesMatch } from "@/lib/data/booking-requests";

const bookingRequestsSource = fs.readFileSync(
  path.join(process.cwd(), "src/lib/data/booking-requests.ts"),
  "utf8",
);
const carrierRequestDetailSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/(carrier)/carrier/requests/[requestId]/page.tsx"),
  "utf8",
);
const carrierMoveRequestPolicySql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/033_carrier_move_request_read_policy.sql"),
  "utf8",
);

const bookingRequest = {
  carrierId: "carrier_1",
  listingId: "listing_1",
  moveRequestId: "move_request_1",
  offerId: "offer_1",
};
const offer = {
  id: "offer_1",
  carrierId: "carrier_1",
  listingId: "listing_1",
  moveRequestId: "move_request_1",
};
const trip = {
  id: "listing_1",
  carrier: {
    id: "carrier_1",
  },
};

test("carrier request dependencies only pass when booking, offer, trip, and carrier line up", () => {
  assert.equal(
    carrierBookingDependenciesMatch({
      carrierId: "carrier_1",
      bookingRequest,
      offer,
      trip,
    }),
    true,
  );

  assert.equal(
    carrierBookingDependenciesMatch({
      carrierId: "carrier_1",
      bookingRequest,
      offer: { ...offer, carrierId: "carrier_2" },
      trip,
    }),
    false,
  );

  assert.equal(
    carrierBookingDependenciesMatch({
      carrierId: "carrier_1",
      bookingRequest,
      offer: { ...offer, moveRequestId: "move_request_2" },
      trip,
    }),
    false,
  );

  assert.equal(
    carrierBookingDependenciesMatch({
      carrierId: "carrier_1",
      bookingRequest,
      offer,
      trip: { ...trip, carrier: { id: "carrier_2" } },
    }),
    false,
  );
});

test("carrier request list and detail loaders do not use admin move-request reads", () => {
  const listCarrierRequestCardsSource = bookingRequestsSource.match(
    /export async function listCarrierRequestCards[\s\S]*?\n}\n\nexport async function listCarrierRecentRequestOutcomeCards/,
  );
  const listCarrierRecentRequestOutcomeCardsSource = bookingRequestsSource.match(
    /export async function listCarrierRecentRequestOutcomeCards[\s\S]*?\n}\n\nexport async function getBookingRequestByIdForCustomer/,
  );

  assert.ok(listCarrierRequestCardsSource, "listCarrierRequestCards source should be present.");
  assert.ok(
    listCarrierRecentRequestOutcomeCardsSource,
    "listCarrierRecentRequestOutcomeCards source should be present.",
  );
  assert.doesNotMatch(listCarrierRequestCardsSource[0], /getMoveRequestByIdForAdmin/);
  assert.doesNotMatch(listCarrierRequestCardsSource[0], /getOfferByIdForAdmin/);
  assert.doesNotMatch(listCarrierRecentRequestOutcomeCardsSource[0], /getMoveRequestByIdForAdmin/);
  assert.doesNotMatch(listCarrierRecentRequestOutcomeCardsSource[0], /getOfferByIdForAdmin/);
  assert.doesNotMatch(carrierRequestDetailSource, /getMoveRequestByIdForAdmin/);
  assert.match(carrierRequestDetailSource, /getMoveRequestByIdForCarrier/);
});

test("carrier move-request reads are backed by an authenticated carrier RLS policy", () => {
  assert.match(carrierMoveRequestPolicySql, /move_requests_carrier_select_requested/);
  assert.match(carrierMoveRequestPolicySql, /for select\s+to authenticated/i);
  assert.match(carrierMoveRequestPolicySql, /public\.booking_requests booking_request/i);
  assert.match(carrierMoveRequestPolicySql, /booking_request\.move_request_id = move_requests\.id/i);
  assert.match(carrierMoveRequestPolicySql, /carrier_row\.user_id = auth\.uid\(\)/i);
});

test("Fast Match accept path refuses stale siblings before creating a booking", () => {
  const acceptSource = bookingRequestsSource.match(
    /export async function applyCarrierBookingRequestAction[\s\S]*?\n}\n$/,
  );

  assert.ok(acceptSource, "accept action source should be present.");
  assert.match(bookingRequestsSource, /ensureFastMatchGroupHasNoAcceptedSibling/);
  assert.match(bookingRequestsSource, /fast_match_already_accepted/);
  assert.ok(
    acceptSource[0].indexOf("ensureFastMatchGroupHasNoAcceptedSibling") <
      acceptSource[0].indexOf('.rpc("create_booking_atomic"'),
    "Fast Match stale-sibling guard should run before booking creation.",
  );
});
