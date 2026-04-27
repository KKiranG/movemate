import { z } from "zod";

import { sanitizeText } from "@/lib/utils";

const sanitizedString = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? sanitizeText(value) : value),
    z.string().min(min).max(max),
  );

const optionalSanitizedString = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const sanitized = sanitizeText(value);
      return sanitized.length > 0 ? sanitized : undefined;
    },
    z.string().max(max).optional(),
  );

function isTodayOrLater(value: string) {
  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate >= today;
}

const optionalFutureDate = z
  .string()
  .refine(isTodayOrLater, "Preferred date must be today or later.")
  .optional();

export const moveRequestSchema = z.object({
  itemDescription: sanitizedString(4, 200),
  itemCategory: z.enum(["furniture", "boxes", "appliance", "fragile", "other"]),
  itemSizeClass: z.enum(["S", "M", "L", "XL"]).optional(),
  itemWeightBand: z
    .enum(["under_20kg", "20_to_50kg", "50_to_100kg", "over_100kg"])
    .optional(),
  itemDimensions: optionalSanitizedString(120),
  itemWeightKg: z.number().min(0).max(500).optional(),
  itemPhotoUrls: z.array(z.string().min(1)).default([]),
  pickupAddress: sanitizedString(8, 160),
  pickupSuburb: sanitizedString(2, 120),
  pickupPostcode: sanitizedString(3, 8),
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  pickupAccessNotes: optionalSanitizedString(240),
  dropoffAddress: sanitizedString(8, 160),
  dropoffSuburb: sanitizedString(2, 120),
  dropoffPostcode: sanitizedString(3, 8),
  dropoffLatitude: z.number().min(-90).max(90),
  dropoffLongitude: z.number().min(-180).max(180),
  dropoffAccessNotes: optionalSanitizedString(240),
  preferredDate: optionalFutureDate,
  preferredTimeWindow: z.enum(["morning", "afternoon", "evening", "flexible"]).optional(),
  needsStairs: z.boolean().default(false),
  needsHelper: z.boolean().default(false),
  customerMoverPreference: z.enum(["one_mover", "customer_help", "two_movers"]).default("one_mover"),
  stairsLevelPickup: z.enum(["none", "low", "medium", "high"]).default("none"),
  stairsLevelDropoff: z.enum(["none", "low", "medium", "high"]).default("none"),
  liftAvailablePickup: z.boolean().default(false),
  liftAvailableDropoff: z.boolean().default(false),
  specialInstructions: optionalSanitizedString(280),
  status: z
    .enum(["draft", "submitted", "matched", "booking_requested", "booked", "expired", "cancelled"])
    .optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export type MoveRequestInput = z.infer<typeof moveRequestSchema>;
