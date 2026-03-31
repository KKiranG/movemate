import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { createTripForCarrier, listCarrierTrips } from "@/lib/data/trips";
import { toErrorResponse } from "@/lib/errors";
import { sanitizeText } from "@/lib/utils";
import type { TripInput } from "@/lib/validation/trip";

function sanitizeTripPayload(payload: Record<string, unknown>): TripInput {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, sanitizeText(value)];
      }

      if (Array.isArray(value)) {
        return [
          key,
          value.map((entry) => (typeof entry === "string" ? sanitizeText(entry) : entry)),
        ];
      }

      return [key, value];
    }),
  ) as TripInput;
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const trips = await listCarrierTrips(user.id);

    return NextResponse.json({ trips });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const payload = sanitizeTripPayload((await request.json()) as Record<string, unknown>);
    const trip = await createTripForCarrier(user.id, payload);

    return NextResponse.json({ trip });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
