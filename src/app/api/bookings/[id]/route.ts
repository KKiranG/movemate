import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser, requireSessionUser } from "@/lib/auth";
import { getBookingActorRoleForUser, updateBookingStatusForActor } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";
import type {
  BookingCancellationReasonCode,
  BookingExceptionCode,
  BookingProofCondition,
} from "@/types/booking";

const bookingExceptionCodeValues = [
  "none",
  "damage",
  "no_show",
  "late",
  "wrong_item",
  "overcharge",
  "other",
] satisfies BookingExceptionCode[];

const bookingProofConditionValues = [
  "no_visible_damage",
  "wear_noted",
  "damage_noted",
] satisfies BookingProofCondition[];

const pickupProofSchema = z.object({
  photoUrl: z.string().min(1),
  itemCount: z.number().int().min(1),
  condition: z.enum(bookingProofConditionValues),
  handoffConfirmed: z.literal(true),
});

const deliveryProofSchema = z
  .object({
    photoUrl: z.string().min(1),
    recipientConfirmed: z.literal(true),
    exceptionCode: z.enum(bookingExceptionCodeValues).optional(),
    exceptionNote: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.exceptionCode && value.exceptionCode !== "none" && !value.exceptionNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exceptionNote"],
        message: "Add an exception note when delivery proof flags an issue.",
      });
    }
  });

const bookingStatusPatchSchema = z.object({
  nextStatus: z.enum(["confirmed", "picked_up", "in_transit", "delivered", "completed", "cancelled"]),
  pickupProof: pickupProofSchema.optional(),
  deliveryProof: deliveryProofSchema.optional(),
  actorRole: z.enum(["carrier", "customer", "admin"]).optional(),
  cancellationReason: z.string().min(1).optional(),
  cancellationReasonCode: z
    .enum([
      "carrier_unavailable",
      "customer_changed_plans",
      "payment_failed",
      "no_response",
      "safety_concern",
    ] satisfies BookingCancellationReasonCode[])
    .optional(),
  reason: z.string().trim().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const payload = bookingStatusPatchSchema.parse(await request.json());

    if (payload.actorRole === "admin") {
      const user = await requireAdminUser();
      const booking = await updateBookingStatusForActor({
        userId: user.id,
        bookingId: params.id,
        nextStatus: payload.nextStatus,
        actorRole: "admin",
        adminReason: payload.reason,
        pickupProof: payload.pickupProof,
        deliveryProof: payload.deliveryProof,
        cancellationReason: payload.cancellationReason,
        cancellationReasonCode: payload.cancellationReasonCode,
      });

      return NextResponse.json({ booking });
    }

    const user = await requireSessionUser();
    const actorRole = await getBookingActorRoleForUser(user.id, params.id);
    const booking = await updateBookingStatusForActor({
      userId: user.id,
      bookingId: params.id,
      nextStatus: payload.nextStatus,
      actorRole,
      pickupProof: payload.pickupProof,
      deliveryProof: payload.deliveryProof,
      cancellationReason: payload.cancellationReason,
      cancellationReasonCode: payload.cancellationReasonCode,
    });

    return NextResponse.json({ booking });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
