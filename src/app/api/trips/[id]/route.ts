import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { cancelTripForCarrier, getTripById, updateTripForCarrier } from "@/lib/data/trips";
import { toErrorResponse } from "@/lib/errors";
import { sanitizeText } from "@/lib/utils";
import type { TripUpdateInput } from "@/lib/validation/trip";

function sanitizeTripUpdatePayload(payload: Record<string, unknown>): TripUpdateInput {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizeText(value) : value,
    ]),
  ) as TripUpdateInput;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const payload = sanitizeTripUpdatePayload(
      (await request.json()) as Record<string, unknown>,
    );
    const trip = await updateTripForCarrier(user.id, params.id, payload);

    return NextResponse.json({ trip });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    await cancelTripForCarrier(user.id, params.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
