import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import {
  createTemplate,
  createTemplateFromTrip,
  listCarrierTemplates,
} from "@/lib/data/templates";
import { AppError, toErrorResponse } from "@/lib/errors";
import type { CreateTripTemplateInput } from "@/types/carrier";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const carrier = await getCarrierByUserId(user.id);

    if (!carrier) {
      throw new AppError("Carrier profile not found.", 404, "carrier_missing");
    }

    const templates = await listCarrierTemplates(carrier.id);
    return NextResponse.json({ templates });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const carrier = await getCarrierByUserId(user.id);

    if (!carrier) {
      throw new AppError("Carrier profile not found.", 404, "carrier_missing");
    }

    const body = (await request.json()) as
      | ({ tripId: string; name: string } & Partial<CreateTripTemplateInput>)
      | CreateTripTemplateInput;
    const hasTripId =
      typeof body === "object" &&
      body !== null &&
      "tripId" in body &&
      typeof body.tripId === "string";

    const template = hasTripId
      ? await createTemplateFromTrip(body.tripId, carrier.id, body.name)
      : await createTemplate(carrier.id, body as CreateTripTemplateInput);

    return NextResponse.json({ template });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
