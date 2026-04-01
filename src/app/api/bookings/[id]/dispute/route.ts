import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { createDisputeForBooking } from "@/lib/data/feedback";
import { toErrorResponse } from "@/lib/errors";
import { disputeSchema } from "@/lib/validation/dispute";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const payload = disputeSchema.parse(await request.json());
    const dispute = await createDisputeForBooking(user.id, params.id, {
      category: payload.category,
      description: payload.description,
      photoUrls: payload.photoUrls ?? [],
    });

    return NextResponse.json({ dispute });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
