import assert from "node:assert/strict";
import test from "node:test";

import { suggestPrice } from "@/lib/pricing/suggest";
import { getMinimumTripBasePriceCents, getRouteDistanceKm } from "@/lib/pricing/guardrails";
import { tripSchema } from "@/lib/validation/trip";

test("intercity routes floor base pricing at fifty dollars", () => {
  const distanceKm = getRouteDistanceKm({
    originLatitude: -33.8688,
    originLongitude: 151.2093,
    destinationLatitude: -37.8136,
    destinationLongitude: 144.9631,
  });

  assert.ok(distanceKm > 250);
  assert.equal(getMinimumTripBasePriceCents(distanceKm), 5000);

  const suggestion = suggestPrice({
    distanceKm,
    spaceSize: "S",
    needsStairs: false,
    needsHelper: false,
    isReturn: true,
  });

  assert.ok(suggestion.midCents >= 5000);
});

test("trip schema blocks prices below the intercity floor", () => {
  const result = tripSchema.safeParse({
    originSuburb: "Sydney",
    originPostcode: "2000",
    originLatitude: -33.8688,
    originLongitude: 151.2093,
    destinationSuburb: "Melbourne",
    destinationPostcode: "3000",
    destinationLatitude: -37.8136,
    destinationLongitude: 144.9631,
    detourRadiusKm: 5,
    tripDate: "2030-05-10",
    timeWindow: "morning",
    spaceSize: "S",
    availableVolumeM3: 0.5,
    availableWeightKg: 40,
    priceCents: 3000,
    accepts: ["furniture"],
    stairsOk: false,
    stairsExtraCents: 0,
    helperAvailable: false,
    helperExtraCents: 0,
    isReturnTrip: false,
    status: "active",
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0]?.message ?? "", /at least \$50/i);
});

test("trip schema blocks prices below a declared minimum base floor", () => {
  const result = tripSchema.safeParse({
    originSuburb: "Newtown",
    originPostcode: "2042",
    originLatitude: -33.8981,
    originLongitude: 151.1745,
    destinationSuburb: "Marrickville",
    destinationPostcode: "2204",
    destinationLatitude: -33.9113,
    destinationLongitude: 151.1557,
    detourRadiusKm: 5,
    tripDate: "2030-05-10",
    timeWindow: "morning",
    spaceSize: "S",
    availableVolumeM3: 0.5,
    availableWeightKg: 40,
    priceCents: 3000,
    minimumBasePriceCents: 5000,
    accepts: ["furniture"],
    stairsOk: false,
    stairsExtraCents: 0,
    helperAvailable: false,
    helperExtraCents: 0,
    isReturnTrip: false,
    status: "active",
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0]?.message ?? "", /at least \$50/i);
});
