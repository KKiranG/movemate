import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { cancelTripForCarrier, getTripById, updateTripForCarrier } from "@/lib/data/trips";
import { AppError, toErrorResponse } from "@/lib/errors";
import { sanitizeText } from "@/lib/utils";
import { tripUpdateSchema } from "@/lib/validation/trip";

function sanitizeTripUpdatePayload(payload: Record<string, unknown>) {
  const sanitizedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizeText(value) : value,
    ]),
  );
  const parsed = tripUpdateSchema.safeParse(sanitizedPayload);

  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Trip update payload is invalid.", 400, "invalid_trip_update");
  }

  return parsed.data;
}

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const trip = await getTripById(params.id);

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const rawPayload = await request.json();

    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
      throw new AppError("Trip update payload is invalid.", 400, "invalid_trip_update");
    }

    const payload = sanitizeTripUpdatePayload(rawPayload as Record<string, unknown>);
    const trip = await updateTripForCarrier(user.id, params.id, payload);

    return NextResponse.json({ trip });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    await cancelTripForCarrier(user.id, params.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
