import { z } from "zod";

import { sanitizeText } from "@/lib/utils";

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

export const bookingRequestSchema = z.object({
  moveRequestId: z.string().uuid(),
  offerId: z.string().uuid(),
  listingId: z.string().uuid(),
  customerId: z.string().uuid(),
  carrierId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  requestGroupId: z.string().uuid().optional(),
  status: z
    .enum([
      "pending",
      "clarification_requested",
      "accepted",
      "declined",
      "expired",
      "revoked",
      "cancelled",
    ])
    .optional(),
  requestedTotalPriceCents: z.number().int().min(0),
  responseDeadlineAt: z.string().datetime({ offset: true }),
  clarificationRoundCount: z.number().int().min(0).max(1).optional(),
  clarificationReason: z
    .enum(["item_details", "access_details", "timing", "photos", "other"])
    .optional(),
  clarificationRequestedAt: z.string().datetime({ offset: true }).optional(),
  clarificationExpiresAt: z.string().datetime({ offset: true }).optional(),
  clarificationMessage: optionalSanitizedString(280),
  customerResponse: optionalSanitizedString(280),
  customerResponseAt: z.string().datetime({ offset: true }).optional(),
  respondedAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export const bookingRequestCreateSchema = z
  .object({
    moveRequestId: z.string().uuid(),
    offerId: z.string().uuid().optional(),
    listingId: z.string().uuid().optional(),
    responseHours: z.number().int().min(12).max(24).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.offerId && !value.listingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose an offer or listing before sending a booking request.",
        path: ["offerId"],
      });
    }
  });

export const fastMatchBookingRequestSchema = z.object({
  moveRequestId: z.string().uuid(),
  listingIds: z.array(z.string().uuid()).min(1).max(3).optional(),
  responseHours: z.number().int().min(12).max(24).optional(),
});

export const bookingRequestActionSchema = z
  .object({
    action: z.enum(["accept", "decline", "clarify"]),
    clarificationReason: z
      .enum(["item_details", "access_details", "timing", "photos", "other"])
      .optional(),
    clarificationMessage: optionalSanitizedString(280),
  })
  .superRefine((value, ctx) => {
    if (value.action === "clarify" && !value.clarificationReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a clarification reason before asking the customer for more detail.",
        path: ["clarificationReason"],
      });
    }

    if (value.action === "clarify" && !value.clarificationMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a clarification message before pausing the request.",
        path: ["clarificationMessage"],
      });
    }
  });

export type BookingRequestCreateInput = z.infer<typeof bookingRequestCreateSchema>;
export type FastMatchBookingRequestInput = z.infer<typeof fastMatchBookingRequestSchema>;
export type BookingRequestActionInput = z.infer<typeof bookingRequestActionSchema>;

export const bookingRequestCustomerResponseSchema = z.object({
  customerResponse: optionalSanitizedString(280).refine(
    (value) => Boolean(value),
    "Add the missing detail before sending your reply.",
  ),
});

export type BookingRequestCustomerResponseInput = z.infer<
  typeof bookingRequestCustomerResponseSchema
>;
