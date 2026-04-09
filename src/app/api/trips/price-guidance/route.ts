import { NextResponse, type NextRequest } from "next/server";

import { getRoutePriceGuidance } from "@/lib/data/listings";
import { toErrorResponse } from "@/lib/errors";
import type { SpaceSize } from "@/types/trip";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const spaceSize = (searchParams.get("spaceSize") ?? "M") as SpaceSize;
    const originLatitude = Number(searchParams.get("originLat"));
    const originLongitude = Number(searchParams.get("originLng"));
    const destinationLatitude = Number(searchParams.get("destinationLat"));
    const destinationLongitude = Number(searchParams.get("destinationLng"));

    const guidance = await getRoutePriceGuidance({
      originSuburb: from,
      destinationSuburb: to,
      fallbackSpaceSize: spaceSize,
      originLatitude: Number.isFinite(originLatitude) ? originLatitude : undefined,
      originLongitude: Number.isFinite(originLongitude) ? originLongitude : undefined,
      destinationLatitude: Number.isFinite(destinationLatitude) ? destinationLatitude : undefined,
      destinationLongitude: Number.isFinite(destinationLongitude) ? destinationLongitude : undefined,
    });

    return NextResponse.json({ guidance });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
