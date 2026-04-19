import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { confirmTripFreshnessCheckinForCarrier } from "@/lib/data/trips";
import { toErrorResponse } from "@/lib/errors";

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  try {
    const user = await requireSessionUser();
    const url = new URL(request.url);
    const window = url.searchParams.get("window");

    if (window !== "24h" && window !== "2h") {
      return NextResponse.redirect(new URL(`/carrier/trips/${params.tripId}?freshness=invalid`, url));
    }

    await confirmTripFreshnessCheckinForCarrier({
      userId: user.id,
      tripId: params.tripId,
      window,
    });

    return NextResponse.redirect(
      new URL(`/carrier/trips/${params.tripId}?freshness=${window}-confirmed`, url),
    );
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.redirect(
      new URL(`/carrier/trips/${params.tripId}?freshness=failed&reason=${encodeURIComponent(response.message)}`, request.url),
    );
  }
}
