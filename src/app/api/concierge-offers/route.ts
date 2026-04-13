import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { createConciergeOffer, sendConciergeOffer } from "@/lib/data/concierge-offers";
import { toErrorResponse } from "@/lib/errors";

const conciergeOfferSchema = z.object({
  unmatchedRequestId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  carrierId: z.string().uuid(),
  quotedTotalPriceCents: z.number().int().positive(),
  note: z.string().trim().max(280).optional(),
  sendNow: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdminUser();
    const payload = conciergeOfferSchema.parse(await request.json());
    const conciergeOffer = await createConciergeOffer({
      adminUserId: user.id,
      unmatchedRequestId: payload.unmatchedRequestId,
      listingId: payload.listingId,
      carrierId: payload.carrierId,
      quotedTotalPriceCents: payload.quotedTotalPriceCents,
      note: payload.note,
    });

    const sentConciergeOffer =
      payload.sendNow === false
        ? conciergeOffer
        : await sendConciergeOffer({
            adminUserId: user.id,
            conciergeOfferId: conciergeOffer.id,
          });

    return NextResponse.json({ conciergeOffer: sentConciergeOffer });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
