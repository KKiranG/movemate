import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { deleteTemplate, duplicateTemplate, updateTemplate } from "@/lib/data/templates";
import { AppError, toErrorResponse } from "@/lib/errors";

const templateUpdateSchema = z.object({
  action: z.literal("duplicate").optional(),
  name: z.string().trim().min(2).max(120).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  isArchived: z.boolean().optional(),
});

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const carrier = await getCarrierByUserId(user.id);

    if (!carrier) {
      throw new AppError("Carrier profile not found.", 404, "carrier_missing");
    }

    await deleteTemplate(params.id, carrier.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const carrier = await getCarrierByUserId(user.id);

    if (!carrier) {
      throw new AppError("Carrier profile not found.", 404, "carrier_missing");
    }

    const payload = templateUpdateSchema.parse(await request.json());

    if (payload.action === "duplicate") {
      const template = await duplicateTemplate(params.id, carrier.id);
      return NextResponse.json({ template });
    }

    const template = await updateTemplate(params.id, carrier.id, {
      name: payload.name,
      notes: payload.notes,
      isArchived: payload.isArchived,
    });

    return NextResponse.json({ template });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
