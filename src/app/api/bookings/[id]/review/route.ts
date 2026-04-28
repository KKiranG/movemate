import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { createReviewForBooking } from "@/lib/data/feedback";
import { toErrorResponse } from "@/lib/errors";

const createBookingReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const payload = createBookingReviewSchema.parse(await request.json());
    const review = await createReviewForBooking(user.id, params.id, payload);

    return NextResponse.json({ review });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
