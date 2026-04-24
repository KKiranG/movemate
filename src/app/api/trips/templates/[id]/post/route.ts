import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { createTripFromTemplate } from "@/lib/data/templates";
import { AppError, toErrorResponse } from "@/lib/errors";

const createTripFromTemplateSchema = z.object({
  tripDate: z.string().trim().min(1),
  timeWindow: z.enum(["morning", "afternoon", "evening", "flexible"]).optional(),
  priceCents: z.number().int().min(0).optional(),
  minimumBasePriceCents: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const carrier = await getCarrierByUserId(user.id);

    if (!carrier) {
      throw new AppError("Carrier profile not found.", 404, "carrier_missing");
    }

    const body = createTripFromTemplateSchema.parse(await request.json());
    const trip = await createTripFromTemplate(params.id, carrier.id, body);

    return NextResponse.json({ trip });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
