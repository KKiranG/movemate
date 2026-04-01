import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { updateCarrierVerificationNotes } from "@/lib/data/carriers";
import { toErrorResponse } from "@/lib/errors";

const updateCarrierNotesSchema = z.object({
  verificationNotes: z.string().max(280).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminUser();
    const payload = updateCarrierNotesSchema.parse(await request.json());
    const carrier = await updateCarrierVerificationNotes({
      carrierId: params.id,
      notes: payload.verificationNotes ?? null,
    });

    return NextResponse.json({ carrier });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
