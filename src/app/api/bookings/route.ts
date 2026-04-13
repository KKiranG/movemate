import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { listUserBookings } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const bookings = await listUserBookings(user.id);

    return NextResponse.json({ bookings });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}

export async function POST(request: NextRequest) {
  void request;
  try {
    await requireSessionUser();
    return NextResponse.json(
      {
        error: "Direct booking is no longer available. Create a move request and send Request to Book or Fast Match instead.",
        code: "direct_booking_deprecated",
      },
      { status: 410 },
    );
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
