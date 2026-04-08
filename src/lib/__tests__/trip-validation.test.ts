import assert from "node:assert/strict";
import test from "node:test";

import {
  getTripConflictWarnings,
  getTripPublishReadiness,
  tripUpdateSchema,
} from "../validation/trip";

function buildTripUpdateInput(
  overrides: Partial<Parameters<typeof tripUpdateSchema.parse>[0]> = {},
) {
  return {
    tripDate: "2026-04-10",
    timeWindow: "morning",
    spaceSize: "M",
    availableVolumeM3: 1.2,
    availableWeightKg: 120,
    detourRadiusKm: 5,
    priceCents: 15000,
    accepts: ["furniture"],
    stairsOk: false,
    stairsExtraCents: 0,
    helperAvailable: false,
    helperExtraCents: 0,
    isReturnTrip: false,
    status: "active",
    specialNotes: "Ground-floor handoff only.",
    ...overrides,
  };
}

test("tripUpdateSchema accepts paused listings for carrier edits", () => {
  const parsed = tripUpdateSchema.parse(
    buildTripUpdateInput({
      status: "paused",
    }),
  );

  assert.equal(parsed.status, "paused");
});

test("getTripPublishReadiness returns soft warnings for flexible timing without notes", () => {
  const issues = getTripPublishReadiness({
    status: "active",
    spaceSize: "L",
    availableVolumeM3: 2.4,
    availableWeightKg: 180,
    accepts: ["furniture"],
    timeWindow: "flexible",
    specialNotes: "",
    helperAvailable: false,
    stairsOk: false,
  });

  assert.ok(issues.some((issue) => issue.code === "flexible_window_needs_note"));
  assert.ok(issues.some((issue) => issue.code === "large_listing_needs_note"));
});

test("getTripConflictWarnings surfaces fragile and large-item fit contradictions as warnings", () => {
  const warnings = getTripConflictWarnings({
    spaceSize: "XL",
    accepts: ["furniture", "fragile"],
    specialNotes: "",
    helperAvailable: false,
    stairsOk: false,
  });

  assert.ok(warnings.some((warning) => warning.code === "xl_ground_floor_conflict"));
  assert.ok(warnings.some((warning) => warning.code === "large_furniture_no_helper_note"));
  assert.ok(warnings.some((warning) => warning.code === "fragile_without_handling_note"));
});
