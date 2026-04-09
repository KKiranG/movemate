import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { createBookingForCustomer, listUserBookings } from "@/lib/data/bookings";
import { AppError, toErrorResponse } from "@/lib/errors";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { enforceRateLimit } from "@/lib/rate-limit";
import { bookingSchema, getBookingTrustIssues } from "@/lib/validation/booking";

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
    const rateLimit = await enforceRateLimit(`booking:create:${user.id}`, 5, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Booking rate limit reached.", code: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))),
          },
        },
      );
    }

    const rawPayload = await request.json();
    const parsedPayload = bookingSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      const trustIssues =
        rawPayload && typeof rawPayload === "object"
          ? getBookingTrustIssues({
              itemDescription:
                typeof (rawPayload as Record<string, unknown>).itemDescription === "string"
                  ? (rawPayload as Record<string, string>).itemDescription
                  : "",
              specialInstructions:
                typeof (rawPayload as Record<string, unknown>).specialInstructions === "string"
                  ? (rawPayload as Record<string, string>).specialInstructions
                  : "",
              itemSizeClass:
                typeof (rawPayload as Record<string, unknown>).itemSizeClass === "string"
                  ? ((rawPayload as Record<string, string>).itemSizeClass as
                      | "S"
                      | "M"
                      | "L"
                      | "XL")
                  : undefined,
              itemWeightKg:
                typeof (rawPayload as Record<string, unknown>).itemWeightKg === "number"
                  ? ((rawPayload as Record<string, number>).itemWeightKg as number)
                  : undefined,
              itemWeightBand:
                typeof (rawPayload as Record<string, unknown>).itemWeightBand === "string"
                  ? ((rawPayload as Record<string, string>).itemWeightBand as
                      | "under_20kg"
                      | "20_to_50kg"
                      | "50_to_100kg"
                      | "over_100kg")
                  : undefined,
              needsHelper:
                typeof (rawPayload as Record<string, unknown>).needsHelper === "boolean"
                  ? ((rawPayload as Record<string, boolean>).needsHelper as boolean)
                  : undefined,
              pickupAccessNotes:
                typeof (rawPayload as Record<string, unknown>).pickupAccessNotes === "string"
                  ? (rawPayload as Record<string, string>).pickupAccessNotes
                  : "",
              dropoffAccessNotes:
                typeof (rawPayload as Record<string, unknown>).dropoffAccessNotes === "string"
                  ? (rawPayload as Record<string, string>).dropoffAccessNotes
                  : "",
            })
          : [];
      const offPlatformIssue = trustIssues.find(
        (issue) => issue.code === "off_platform_payment_request",
      );

      if (offPlatformIssue) {
        await trackAnalyticsEvent({
          eventName: "off_platform_payment_detected",
          userId: user.id,
          pathname: "/api/bookings",
          metadata: {
            carrierId:
              typeof (rawPayload as Record<string, unknown>)?.carrierId === "string"
                ? (rawPayload as Record<string, string>).carrierId
                : null,
            listingId:
              typeof (rawPayload as Record<string, unknown>)?.listingId === "string"
                ? (rawPayload as Record<string, string>).listingId
                : null,
            specialInstructions:
              typeof (rawPayload as Record<string, unknown>)?.specialInstructions === "string"
                ? (rawPayload as Record<string, string>).specialInstructions
                : null,
          },
        });

        throw new AppError(
          offPlatformIssue.message,
          400,
          "off_platform_payment_request",
        );
      }

      throw new AppError(
        parsedPayload.error.issues[0]?.message ?? "Booking payload is invalid.",
        400,
        "invalid_booking",
      );
    }

    const payload = parsedPayload.data;
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const booking = await createBookingForCustomer(user.id, payload, { idempotencyKey });

    await trackAnalyticsEvent({
      eventName: "booking_started",
      userId: user.id,
      pathname: `/trip/${booking.listingId}`,
      dedupeKey: `booking_started:${booking.id}`,
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
