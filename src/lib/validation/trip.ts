import { z } from "zod";

import { getMinimumTripBasePriceCents, getRouteDistanceKm } from "@/lib/pricing/guardrails";
import { sanitizeText } from "@/lib/utils";

const categorySet = z.enum([
  "furniture",
  "boxes",
  "appliance",
  "fragile",
  "other",
]);

function isTodayOrLater(value: string) {
  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate >= today;
}

const futureTripDate = z
  .string()
  .min(1)
  .refine(isTodayOrLater, "Trip date must be today or later.");

const optionalNotes = z.preprocess(
  (value) => (typeof value === "string" ? sanitizeText(value) : value),
  z.string().max(280).optional(),
);

const optionalPublishAt = z
  .string()
  .datetime({ offset: true })
  .optional()
  .or(z.literal("").transform(() => undefined));

const ACTIVE_SPACE_VOLUME_MINIMUMS = {
  S: 0.25,
  M: 0.8,
  L: 1.8,
  XL: 3.2,
} as const;

const ACTIVE_SPACE_WEIGHT_MINIMUMS = {
  S: 20,
  M: 60,
  L: 120,
  XL: 220,
} as const;

const APPLIANCE_MINIMUM_VOLUME_M3 = 0.8;
const APPLIANCE_MINIMUM_WEIGHT_KG = 70;

export type TripPublishReadinessSeverity = "blocking" | "warning";

export interface TripPublishReadinessIssue {
  code:
    | "space_volume_too_low"
    | "space_weight_too_low"
    | "appliance_volume_too_low"
    | "appliance_weight_too_low"
    | "fragile_notes_missing"
    | "appliance_handling_note_missing"
    | "flexible_window_needs_note"
    | "large_listing_needs_note";
  severity: TripPublishReadinessSeverity;
  message: string;
  hint: string;
  path: Array<
    "spaceSize" | "availableVolumeM3" | "availableWeightKg" | "accepts" | "specialNotes" | "timeWindow"
  >;
}

export interface TripPublishReadinessInput {
  status?: "draft" | "active" | "paused" | "cancelled";
  spaceSize: "S" | "M" | "L" | "XL";
  availableVolumeM3: number;
  availableWeightKg: number;
  accepts: Array<"furniture" | "boxes" | "appliance" | "fragile" | "other">;
  timeWindow: "morning" | "afternoon" | "evening" | "flexible";
  specialNotes?: string | null | undefined;
  helperAvailable?: boolean;
  stairsOk?: boolean;
}

export interface TripConflictWarning {
  code:
    | "xl_ground_floor_conflict"
    | "large_furniture_no_helper_note"
    | "fragile_without_handling_note";
  message: string;
  hint: string;
}

export function getTripPublishReadiness(input: TripPublishReadinessInput) {
  const issues: TripPublishReadinessIssue[] = [];

  const minimumVolume = ACTIVE_SPACE_VOLUME_MINIMUMS[input.spaceSize];
  const minimumWeight = ACTIVE_SPACE_WEIGHT_MINIMUMS[input.spaceSize];
  const trimmedNotes = input.specialNotes?.trim() ?? "";

  if (input.availableVolumeM3 < minimumVolume) {
    issues.push({
      code: "space_volume_too_low",
      severity: "blocking",
      message: `${input.spaceSize} listings need at least ${minimumVolume}m3 to publish cleanly.`,
      hint: "Increase the published volume or save the route as draft until the spare room is confirmed.",
      path: ["availableVolumeM3"],
    });
  }

  if (input.availableWeightKg < minimumWeight) {
    issues.push({
      code: "space_weight_too_low",
      severity: "blocking",
      message: `${input.spaceSize} listings need at least ${minimumWeight}kg to stay believable in browse.`,
      hint: "Raise the weight limit or move the listing back to draft until capacity is firm.",
      path: ["availableWeightKg"],
    });
  }

  if (input.accepts.includes("appliance") && input.availableVolumeM3 < APPLIANCE_MINIMUM_VOLUME_M3) {
    issues.push({
      code: "appliance_volume_too_low",
      severity: "blocking",
      message: "Appliance listings need at least 0.8m3 of spare room before they go live.",
      hint: "Remove appliances from the accepted item types or publish with more space.",
      path: ["accepts", "availableVolumeM3"],
    });
  }

  if (input.accepts.includes("appliance") && input.availableWeightKg < APPLIANCE_MINIMUM_WEIGHT_KG) {
    issues.push({
      code: "appliance_weight_too_low",
      severity: "blocking",
      message: "Appliance listings need at least 70kg of available weight before they go live.",
      hint: "Remove appliances from the accepted item types or raise the published weight limit.",
      path: ["accepts", "availableWeightKg"],
    });
  }

  if (input.accepts.includes("fragile") && !trimmedNotes) {
    issues.push({
      code: "fragile_notes_missing",
      severity: "warning",
      message: "Fragile items are accepted, but the listing does not explain the handling limits yet.",
      hint: "Add one plain-language note about packing, load restraint, or weather protection.",
      path: ["specialNotes"],
    });
  }

  if (
    input.accepts.includes("appliance") &&
    !trimmedNotes &&
    !input.helperAvailable &&
    !input.stairsOk
  ) {
    issues.push({
      code: "appliance_handling_note_missing",
      severity: "warning",
      message: "Appliances are accepted without any helper, stairs, or handling note.",
      hint: "Call out limits like curbside-only handoff, no stairs, or helper required for bulky loads.",
      path: ["specialNotes"],
    });
  }

  if (input.timeWindow === "flexible" && !trimmedNotes) {
    issues.push({
      code: "flexible_window_needs_note",
      severity: "warning",
      message: "Flexible timing converts better when the listing explains the rough pickup rhythm.",
      hint: "Add a short note like after 2pm, school-hours only, or customer should expect a call ahead.",
      path: ["timeWindow", "specialNotes"],
    });
  }

  if ((input.spaceSize === "L" || input.spaceSize === "XL") && trimmedNotes.length < 12) {
    issues.push({
      code: "large_listing_needs_note",
      severity: "warning",
      message: "Bigger listings need one plain-language handling note before they feel trustworthy in browse.",
      hint: "Call out access limits, curbside-only handoff, or how bulky items should be prepared.",
      path: ["spaceSize", "specialNotes"],
    });
  }

  return issues;
}

export function getTripConflictWarnings(input: Pick<
  TripPublishReadinessInput,
  "spaceSize" | "accepts" | "specialNotes" | "helperAvailable" | "stairsOk"
>) {
  const warnings: TripConflictWarning[] = [];
  const trimmedNotes = input.specialNotes?.trim().toLowerCase() ?? "";
  const acceptsLargeFurniture = input.accepts.includes("furniture") || input.accepts.includes("appliance");

  if (input.spaceSize === "XL" && !input.stairsOk) {
    warnings.push({
      code: "xl_ground_floor_conflict",
      message: "XL spare room with no stairs support can still work, but customers need the ground-floor boundary called out clearly.",
      hint: "Keep this if it is true, but explain ground-floor or lift-only access in the listing notes.",
    });
  }

  if (acceptsLargeFurniture && !input.helperAvailable && !trimmedNotes) {
    warnings.push({
      code: "large_furniture_no_helper_note",
      message: "Large furniture is accepted without helper support or a handling note.",
      hint: "Add a note like curbside-only, customer helps lift, or no disassembly on this route.",
    });
  }

  if (input.accepts.includes("fragile") && !trimmedNotes.includes("fragile") && !trimmedNotes.includes("wrap")) {
    warnings.push({
      code: "fragile_without_handling_note",
      message: "Fragile items are accepted, but the listing does not say how they should be packed or handed over.",
      hint: "Add a short note about padding, wrapping, or weather protection expectations.",
    });
  }

  return warnings;
}

function applyTripPublishIssues(
  data: TripPublishReadinessInput,
  ctx: z.RefinementCtx,
) {
  if (data.status !== "active") {
    return;
  }

  for (const issue of getTripPublishReadiness(data).filter(
    (entry) => entry.severity === "blocking",
  )) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: issue.path,
      message: issue.message,
    });
  }
}

function applyTripPriceGuardrail(
  data: {
    originLatitude: number;
    originLongitude: number;
    destinationLatitude: number;
    destinationLongitude: number;
    priceCents: number;
  },
  ctx: z.RefinementCtx,
) {
  const distanceKm = getRouteDistanceKm({
    originLatitude: data.originLatitude,
    originLongitude: data.originLongitude,
    destinationLatitude: data.destinationLatitude,
    destinationLongitude: data.destinationLongitude,
  });
  const minimumPriceCents = getMinimumTripBasePriceCents(distanceKm);

  if (data.priceCents < minimumPriceCents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["priceCents"],
      message: `Trips on this corridor need to be at least $${(minimumPriceCents / 100).toFixed(0)}.`,
    });
  }
}

export const tripSchema = z
  .object({
    vehicleId: z.string().uuid().optional(),
    originSuburb: z.string().min(2).max(120),
    originPostcode: z.string().min(4).max(8),
    originLatitude: z.number().min(-90).max(90),
    originLongitude: z.number().min(-180).max(180),
    destinationSuburb: z.string().min(2).max(120),
    destinationPostcode: z.string().min(4).max(8),
    destinationLatitude: z.number().min(-90).max(90),
    destinationLongitude: z.number().min(-180).max(180),
    detourRadiusKm: z.number().min(0).max(30),
    tripDate: futureTripDate,
    timeWindow: z.enum(["morning", "afternoon", "evening", "flexible"]),
    spaceSize: z.enum(["S", "M", "L", "XL"]),
    availableVolumeM3: z.number().min(0.1).max(8),
    availableWeightKg: z.number().min(20).max(500),
    priceCents: z.number().min(1000).max(100000),
    suggestedPriceCents: z.number().min(1000).max(100000).optional(),
    accepts: z.array(categorySet).min(1),
    stairsOk: z.boolean().default(false),
    stairsExtraCents: z.number().min(0).default(0),
    helperAvailable: z.boolean().default(false),
    helperExtraCents: z.number().min(0).default(0),
    isReturnTrip: z.boolean().default(false),
    status: z.enum(["draft", "active"]).default("active"),
    publishAt: optionalPublishAt,
    specialNotes: optionalNotes,
  })
  .superRefine((data, ctx) => {
    applyTripPublishIssues(data, ctx);
    applyTripPriceGuardrail(data, ctx);
  });

export const tripUpdateSchema = z
  .object({
    vehicleId: z.string().uuid().optional(),
    tripDate: futureTripDate,
    timeWindow: z.enum(["morning", "afternoon", "evening", "flexible"]),
    spaceSize: z.enum(["S", "M", "L", "XL"]),
    availableVolumeM3: z.number().min(0.1).max(8),
    availableWeightKg: z.number().min(20).max(500),
    detourRadiusKm: z.number().min(0).max(30),
    priceCents: z.number().min(1000).max(100000),
    accepts: z.array(categorySet).min(1),
    stairsOk: z.boolean().default(false),
    stairsExtraCents: z.number().min(0).default(0),
    helperAvailable: z.boolean().default(false),
    helperExtraCents: z.number().min(0).default(0),
    isReturnTrip: z.boolean().default(false),
    status: z.enum(["draft", "active", "paused", "cancelled"]),
    publishAt: optionalPublishAt,
    specialNotes: optionalNotes,
  })
  .superRefine((data, ctx) => applyTripPublishIssues(data, ctx));

export type TripInput = z.infer<typeof tripSchema>;
export type TripUpdateInput = z.infer<typeof tripUpdateSchema>;
