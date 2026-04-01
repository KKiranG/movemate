import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser, requireSessionUser } from "@/lib/auth";
import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";
import type { BookingCancellationReasonCode } from "@/types/booking";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const payload = (await request.json()) as {
      nextStatus: "confirmed" | "picked_up" | "in_transit" | "delivered" | "cancelled";
      pickupProofPhotoUrl?: string;
      deliveryProofPhotoUrl?: string;
      actorRole?: "carrier" | "admin";
      cancellationReason?: string;
      cancellationReasonCode?: BookingCancellationReasonCode;
    };

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
    const booking = await updateBookingStatusForActor({
      userId: user.id,
      bookingId: params.id,
      nextStatus: payload.nextStatus,
      actorRole: "carrier",
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
