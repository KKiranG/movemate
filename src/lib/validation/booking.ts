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

export const bookingSchema = z.object({
  listingId: z.string().uuid(),
  carrierId: z.string().uuid(),
  itemDescription: sanitizedString(4, 200),
  itemCategory: z.enum(["furniture", "boxes", "appliance", "fragile", "other"]),
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
  pickupContactPhone: optionalSanitizedString(24),
  dropoffContactName: optionalSanitizedString(120),
  dropoffContactPhone: optionalSanitizedString(24),
});

export type BookingInput = z.infer<typeof bookingSchema>;
