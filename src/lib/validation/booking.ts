import { z } from "zod";

import { sanitizeText } from "@/lib/utils";

const sanitizedString = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? sanitizeText(value) : value),
    z.string().min(min).max(max),
  );

const optionalSanitizedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? sanitizeText(value) : value),
    z.string().max(max).optional(),
  );

function isValidPhoneNumber(value: string) {
  const compact = value.replace(/\s+/g, "");

  if (!compact) {
    return true;
  }

  return (
    /^(?:\+61|0)4\d{8}$/.test(compact) ||
    /^(?:\+61|0)[2378]\d{8}$/.test(compact) ||
    /^\+\d{6,15}$/.test(compact)
  );
}

const optionalPhoneNumber = () =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const sanitized = sanitizeText(value);
      return sanitized.length > 0 ? sanitized : undefined;
    },
    z
      .string()
      .max(24)
      .refine(isValidPhoneNumber, "Enter a valid Australian or international phone number.")
      .optional(),
  );

const PROHIBITED_ITEM_RULES = [
  {
    pattern: /\basbestos(?:\s+sheeting)?\b/i,
    message: "Asbestos and asbestos sheeting are not allowed on moverrr.",
    hint: "This needs a licensed disposal path, not a spare-capacity trip.",
  },
  {
    pattern: /\b(contaminated waste|hazardous waste|biohazard|contaminated soil)\b/i,
    message: "Contaminated or hazardous waste is out of scope for moverrr.",
    hint: "Bookings must stay inside ordinary household or business moving items.",
  },
  {
    pattern:
      /\b(chemical drum|solvent drum|paint disposal|regulated waste|regulated disposal|chemical disposal)\b/i,
    message: "Regulated chemical or disposal jobs are not allowed on moverrr.",
    hint: "Remove the regulated item and use a compliant disposal or specialist service instead.",
  },
] as const;

const OFF_PLATFORM_PAYMENT_RULES = [
  {
    pattern: /\b(payid|bank transfer|direct deposit|cash extra|cash only|pay outside)\b/i,
    message: "Payments must stay in moverrr for your protection. Remove cash, bank transfer, or side-payment requests.",
    hint: "moverrr only supports the listed add-ons or an admin-reviewed exception.",
  },
] as const;

const MANUAL_HANDLING_PATTERNS = [
  /\bfridge\b/i,
  /\bwashing machine\b/i,
  /\bpiano\b/i,
  /\bsafe\b/i,
  /\bpool table\b/i,
  /\bwardrobe\b/i,
  /\bmattress\b/i,
  /\bsofa\b/i,
] as const;

export type BookingTrustIssueSeverity = "blocking" | "warning";

export interface BookingTrustIssue {
  code:
    | "prohibited_item"
    | "off_platform_payment_request"
    | "manual_handling_helper_recommended"
    | "manual_handling_access_notes_missing";
  severity: BookingTrustIssueSeverity;
  message: string;
  hint: string;
  path: Array<
    | "itemDescription"
    | "itemSizeClass"
    | "specialInstructions"
    | "itemWeightKg"
    | "itemWeightBand"
    | "pickupAccessNotes"
    | "dropoffAccessNotes"
    | "needsHelper"
  >;
}

export interface BookingTrustInput {
  itemDescription: string;
  specialInstructions?: string;
  itemSizeClass?: "S" | "M" | "L" | "XL";
  itemWeightKg?: number;
  itemWeightBand?: "under_20kg" | "20_to_50kg" | "50_to_100kg" | "over_100kg";
  needsHelper?: boolean;
  pickupAccessNotes?: string;
  dropoffAccessNotes?: string;
}

export function getBookingTrustIssues(input: BookingTrustInput) {
  const issues: BookingTrustIssue[] = [];
  const joinedText = [input.itemDescription, input.specialInstructions].filter(Boolean).join(" ");
  const looksHeavy =
    (typeof input.itemWeightKg === "number" && input.itemWeightKg >= 70) ||
    input.itemWeightBand === "50_to_100kg" ||
    input.itemWeightBand === "over_100kg";
  const looksAwkward = MANUAL_HANDLING_PATTERNS.some((pattern) => pattern.test(joinedText));
  const looksLargeBySize = input.itemSizeClass === "L" || input.itemSizeClass === "XL";
  const looksManualHandlingRisk = looksHeavy || looksAwkward || looksLargeBySize;
  const accessNotesProvided = Boolean(
    input.pickupAccessNotes?.trim() || input.dropoffAccessNotes?.trim(),
  );

  for (const rule of PROHIBITED_ITEM_RULES) {
    if (rule.pattern.test(joinedText)) {
      issues.push({
        code: "prohibited_item",
        severity: "blocking",
        message: rule.message,
        hint: rule.hint,
        path: ["itemDescription", "specialInstructions"],
      });
      break;
    }
  }

  for (const rule of OFF_PLATFORM_PAYMENT_RULES) {
    if (rule.pattern.test(joinedText)) {
      issues.push({
        code: "off_platform_payment_request",
        severity: "blocking",
        message: rule.message,
        hint: rule.hint,
        path: ["specialInstructions"],
      });
      break;
    }
  }

  if (looksManualHandlingRisk && !input.needsHelper) {
    issues.push({
      code: "manual_handling_helper_recommended",
      severity: "warning",
      message: "This looks like a bulky or one-person-risky item. Re-check whether a helper is needed.",
      hint: "Heavy, awkward, or bulky pieces usually need the helper toggle and clearer handling expectations.",
        path: ["needsHelper", "itemWeightKg", "itemWeightBand", "itemSizeClass"],
    });
  }

  if (looksManualHandlingRisk && !accessNotesProvided) {
    issues.push({
      code: "manual_handling_access_notes_missing",
      severity: "warning",
      message: "Manual-handling risk is higher when pickup and dropoff access are still blank.",
      hint: "Add stairs, lift, loading dock, or gate details before you continue.",
      path: ["pickupAccessNotes", "dropoffAccessNotes"],
    });
  }

  return issues;
}

export const bookingSchema = z
  .object({
    listingId: z.string().uuid(),
    carrierId: z.string().uuid(),
    itemDescription: sanitizedString(4, 200),
    itemCategory: z.enum(["furniture", "boxes", "appliance", "fragile", "other"]),
    itemSizeClass: z.enum(["S", "M", "L", "XL"]).optional(),
    itemWeightBand: z
      .enum(["under_20kg", "20_to_50kg", "50_to_100kg", "over_100kg"])
      .optional(),
    itemDimensions: optionalSanitizedString(120),
    itemWeightKg: z.number().min(0).max(500).optional(),
    itemPhotoUrls: z.array(z.string().min(1)).default([]),
    needsStairs: z.boolean().default(false),
    needsHelper: z.boolean().default(false),
    specialInstructions: optionalSanitizedString(280),
    pickupAddress: sanitizedString(8, 160),
    pickupSuburb: sanitizedString(2, 120),
    pickupPostcode: sanitizedString(4, 8),
    pickupLatitude: z.number().min(-90).max(90),
    pickupLongitude: z.number().min(-180).max(180),
    dropoffAddress: sanitizedString(8, 160),
    dropoffSuburb: sanitizedString(2, 120),
    dropoffPostcode: sanitizedString(4, 8),
    dropoffLatitude: z.number().min(-90).max(90),
    dropoffLongitude: z.number().min(-180).max(180),
    pickupAccessNotes: optionalSanitizedString(240),
    dropoffAccessNotes: optionalSanitizedString(240),
    pickupContactName: optionalSanitizedString(120),
    pickupContactPhone: optionalPhoneNumber(),
    dropoffContactName: optionalSanitizedString(120),
    dropoffContactPhone: optionalPhoneNumber(),
  })
  .superRefine((data, ctx) => {
    for (const issue of getBookingTrustIssues(data).filter(
      (entry) => entry.severity === "blocking",
    )) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  });

export const bookingCancellationReasonCodeSchema = z.enum([
  "carrier_unavailable",
  "customer_changed_plans",
  "payment_failed",
  "no_response",
  "safety_concern",
]);

export type BookingInput = z.infer<typeof bookingSchema>;
