import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import {
  createTemplate,
  createTemplateFromTrip,
  listCarrierTemplates,
} from "@/lib/data/templates";
import { AppError, toErrorResponse } from "@/lib/errors";
import type { CreateTripTemplateInput } from "@/types/carrier";

const createTemplateFromTripSchema = z.object({
  tripId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
});

const createTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  originSuburb: z.string().trim().min(2).max(120),
  originPostcode: z.string().trim().min(3).max(8),
  originLatitude: z.number(),
  originLongitude: z.number(),
  destinationSuburb: z.string().trim().min(2).max(120),
  destinationPostcode: z.string().trim().min(3).max(8),
  destinationLatitude: z.number(),
  destinationLongitude: z.number(),
  spaceSize: z.enum(["S", "M", "L", "XL"]),
  availableVolumeM3: z.number().nullable().optional(),
  maxWeightKg: z.number().nullable().optional(),
  detourRadiusKm: z.number().optional(),
  suggestedPriceCents: z.number().int().min(0),
  minimumBasePriceCents: z.number().int().min(0).optional(),
  stairsOk: z.boolean().optional(),
  stairsExtraCents: z.number().int().min(0).optional(),
  helperExtraCents: z.number().int().min(0).optional(),
  helperAvailable: z.boolean().optional(),
  accepts: z.array(z.string()).min(1),
  timeWindow: z.enum(["morning", "afternoon", "evening", "flexible"]).optional(),
  notes: z.string().trim().max(1000).optional(),
});

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

    const rawBody = await request.json();
    const hasTripId =
      typeof rawBody === "object" &&
      rawBody !== null &&
      "tripId" in rawBody &&
      typeof rawBody.tripId === "string";
    const template = hasTripId
      ? await (async () => {
          const body = createTemplateFromTripSchema.parse(rawBody);
          return createTemplateFromTrip(body.tripId, carrier.id, body.name);
        })()
      : await (async () => {
          const body = createTemplateSchema.parse(rawBody);
          return createTemplate(carrier.id, body as CreateTripTemplateInput);
        })();

    return NextResponse.json({ template });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
