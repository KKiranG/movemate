import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  applyCarrierBookingRequestAction,
  getBookingRequestByIdForCustomer,
  respondToBookingRequestClarification,
} from "@/lib/data/booking-requests";
import { toErrorResponse } from "@/lib/errors";
import {
  bookingRequestActionSchema,
  bookingRequestCustomerResponseSchema,
} from "@/lib/validation/booking-request";

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const bookingRequest = await getBookingRequestByIdForCustomer(user.id, context.params.id);

    if (!bookingRequest) {
      return NextResponse.json(
        { error: "Booking request not found.", code: "booking_request_not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ bookingRequest });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();

    if ("action" in body) {
      const payload = bookingRequestActionSchema.parse(body);
      const result = await applyCarrierBookingRequestAction(user.id, context.params.id, payload);

      await trackAnalyticsEvent({
        eventName: "booking_request_action_applied",
        userId: user.id,
        pathname: `/api/booking-requests/${context.params.id}`,
        dedupeKey: `booking_request_action:${result.bookingRequest.id}:${payload.action}:${result.bookingRequest.updatedAt}`,
        metadata: {
          bookingRequestId: result.bookingRequest.id,
          action: payload.action,
          bookingId: result.booking?.id ?? null,
          requestGroupId: result.bookingRequest.requestGroupId ?? null,
        },
      });

      return NextResponse.json(result);
    }

    const payload = bookingRequestCustomerResponseSchema.parse(body);
    const bookingRequest = await respondToBookingRequestClarification(
      user.id,
      context.params.id,
      payload,
    );

    await trackAnalyticsEvent({
      eventName: "booking_request_customer_response_submitted",
      userId: user.id,
      pathname: `/api/booking-requests/${context.params.id}`,
      dedupeKey: `booking_request_customer_response:${bookingRequest.id}:${bookingRequest.updatedAt}`,
      metadata: {
        bookingRequestId: bookingRequest.id,
        moveRequestId: bookingRequest.moveRequestId,
        requestGroupId: bookingRequest.requestGroupId ?? null,
      },
    });

    return NextResponse.json({ bookingRequest });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
