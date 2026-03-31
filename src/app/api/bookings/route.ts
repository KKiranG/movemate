import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { createBookingForCustomer, listUserBookings } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";
import { trackAnalyticsEvent } from "@/lib/analytics";

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
  try {
    const user = await requireSessionUser();
    const payload = await request.json();
    const booking = await createBookingForCustomer(user.id, payload);

    await trackAnalyticsEvent({
      eventName: "booking_started",
      userId: user.id,
      pathname: `/trip/${booking.listingId}`,
      metadata: {
        bookingId: booking.id,
        totalPriceCents: booking.pricing.totalPriceCents,
      },
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
