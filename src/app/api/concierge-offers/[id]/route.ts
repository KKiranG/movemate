import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser, requireSessionUser } from "@/lib/auth";
import { cancelConciergeOffer, respondToConciergeOffer } from "@/lib/data/concierge-offers";
import { toErrorResponse } from "@/lib/errors";

const customerConciergeOfferActionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

const adminConciergeOfferActionSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().trim().max(280).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();

    if (typeof body?.action === "string" && body.action === "cancel") {
      const user = await requireAdminUser();
      const payload = adminConciergeOfferActionSchema.parse(body);
      const conciergeOffer = await cancelConciergeOffer({
        adminUserId: user.id,
        conciergeOfferId: (await context.params).id,
        reason: payload.reason,
      });

      return NextResponse.json({ conciergeOffer });
    }

    const user = await requireSessionUser();
    const payload = customerConciergeOfferActionSchema.parse(body);
    const result = await respondToConciergeOffer({
      userId: user.id,
      conciergeOfferId: (await context.params).id,
      action: payload.action,
    });

    return NextResponse.json(result);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
