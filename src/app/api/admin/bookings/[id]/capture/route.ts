import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { captureBookingPaymentForAdmin } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";

const captureRequestSchema = z.object({
  reason: z.string().trim().min(8),
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await requireAdminUser();
    const payload = captureRequestSchema.parse(await request.json());
    const booking = await captureBookingPaymentForAdmin({
      bookingId: params.id,
      adminUserId: admin.id,
      reason: payload.reason,
    });

    return NextResponse.json({ booking });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
