import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";

const confirmReceiptSchema = z.object({
  confirmation: z.literal("received").optional(),
});

export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    confirmReceiptSchema.parse(await _request.json().catch(() => ({})));
    const booking = await updateBookingStatusForActor({
      userId: user.id,
      bookingId: params.id,
      nextStatus: "completed",
      actorRole: "customer",
    });

    return NextResponse.json({ booking });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
