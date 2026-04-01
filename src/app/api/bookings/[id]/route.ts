import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser, requireSessionUser } from "@/lib/auth";
import { getBookingActorRoleForUser, updateBookingStatusForActor } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";
import type { BookingCancellationReasonCode } from "@/types/booking";

const bookingStatusPatchSchema = z.object({
  nextStatus: z.enum(["confirmed", "picked_up", "in_transit", "delivered", "completed", "cancelled"]),
  pickupProofPhotoUrl: z.string().min(1).optional(),
  deliveryProofPhotoUrl: z.string().min(1).optional(),
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
        pickupProofPhotoUrl: payload.pickupProofPhotoUrl,
        deliveryProofPhotoUrl: payload.deliveryProofPhotoUrl,
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
      pickupProofPhotoUrl: payload.pickupProofPhotoUrl,
      deliveryProofPhotoUrl: payload.deliveryProofPhotoUrl,
      cancellationReason: payload.cancellationReason,
      cancellationReasonCode: payload.cancellationReasonCode,
    });

    return NextResponse.json({ booking });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
