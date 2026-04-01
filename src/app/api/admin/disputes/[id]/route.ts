import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { resolveDispute } from "@/lib/data/admin";
import { toErrorResponse } from "@/lib/errors";

const resolveDisputeSchema = z.object({
  status: z.enum(["investigating", "resolved", "closed"]),
  resolutionNotes: z.string().trim().min(20).max(2000),
  bookingStatus: z.enum(["completed", "cancelled"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAdminUser();
    const payload = resolveDisputeSchema.parse(await request.json());

    const dispute = await resolveDispute({
      disputeId: params.id,
      resolvedBy: user.id,
      status: payload.status,
      resolutionNotes: payload.resolutionNotes,
      bookingStatus: payload.bookingStatus,
    });

    return NextResponse.json({ dispute });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
