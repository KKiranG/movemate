import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { deleteTemplate, duplicateTemplate, updateTemplate } from "@/lib/data/templates";
import { AppError, toErrorResponse } from "@/lib/errors";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const carrier = await getCarrierByUserId(user.id);

    if (!carrier) {
      throw new AppError("Carrier profile not found.", 404, "carrier_missing");
    }

    const payload = (await request.json()) as {
      action?: "duplicate";
      name?: string;
      notes?: string | null;
      isArchived?: boolean;
    };

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
