import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { unsuspendTripForAdmin } from "@/lib/data/trips";

const freshnessPatchSchema = z.object({
  action: z.enum(["unsuspend"]),
  reason: z.string().trim().min(12).max(280),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireAdminUser();
    const payload = freshnessPatchSchema.parse(await request.json());

    if (payload.action === "unsuspend") {
      await unsuspendTripForAdmin({
        adminUserId: user.id,
        tripId: params.id,
        reason: payload.reason,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
