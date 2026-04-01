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

    const guidance = await getRoutePriceGuidance({
      originSuburb: from,
      destinationSuburb: to,
      fallbackSpaceSize: spaceSize,
    });

    return NextResponse.json({ guidance });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
