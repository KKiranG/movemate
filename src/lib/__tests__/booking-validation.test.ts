import assert from "node:assert/strict";
import test from "node:test";

import { bookingSchema, getBookingTrustIssues } from "@/lib/validation/booking";

const baseInput = {
  listingId: "11111111-1111-4111-8111-111111111111",
  carrierId: "22222222-2222-4222-8222-222222222222",
  itemDescription: "Large dining table",
  itemCategory: "furniture" as const,
  pickupAddress: "10 Pitt Street, Sydney NSW 2000",
  pickupSuburb: "Sydney",
  pickupPostcode: "2000",
  pickupLatitude: -33.8688,
  pickupLongitude: 151.2093,
  dropoffAddress: "20 George Street, Newtown NSW 2042",
  dropoffSuburb: "Newtown",
  dropoffPostcode: "2042",
  dropoffLatitude: -33.8981,
  dropoffLongitude: 151.1748,
};

test("blocks asbestos sheeting through the trust rules and schema", () => {
  const input = {
    ...baseInput,
    itemDescription: "Asbestos sheeting from a garage wall",
  };

  const issues = getBookingTrustIssues(input);

  assert.equal(issues[0]?.code, "prohibited_item");
  assert.equal(issues[0]?.severity, "blocking");

  const result = bookingSchema.safeParse(input);
  assert.equal(result.success, false);
  assert.match(result.error.issues[0]?.message ?? "", /Asbestos/i);
});

test("blocks contaminated waste and regulated disposal jobs", () => {
  const contaminated = getBookingTrustIssues({
    ...baseInput,
    itemDescription: "Contaminated waste bags",
  });
  const regulated = getBookingTrustIssues({
    ...baseInput,
    itemDescription: "Chemical disposal drums",
  });

  assert.equal(contaminated[0]?.code, "prohibited_item");
  assert.equal(regulated[0]?.code, "prohibited_item");
});

test("warns on manual handling risk without helper or access notes", () => {
  const issues = getBookingTrustIssues({
    ...baseInput,
    itemDescription: "Single-door fridge",
    itemSizeClass: "L",
    itemWeightBand: "50_to_100kg",
    itemWeightKg: 92,
    needsHelper: false,
    pickupAccessNotes: "",
    dropoffAccessNotes: "",
  });

  assert.deepEqual(
    issues.map((issue) => issue.code).sort(),
    [
      "manual_handling_access_notes_missing",
      "manual_handling_helper_recommended",
    ],
  );

  const result = bookingSchema.safeParse({
    ...baseInput,
    itemDescription: "Single-door fridge",
    itemWeightKg: 92,
    needsHelper: false,
  });
  assert.equal(result.success, true);
});

test("clears manual handling warnings when helper and access detail are provided", () => {
  const issues = getBookingTrustIssues({
    ...baseInput,
    itemDescription: "Single-door fridge",
    itemWeightKg: 92,
    needsHelper: true,
    pickupAccessNotes: "One short stair at pickup.",
    dropoffAccessNotes: "Lift access with loading bay.",
  });

  assert.equal(issues.length, 0);
});
