import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { deleteTemplate } from "@/lib/data/templates";
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
