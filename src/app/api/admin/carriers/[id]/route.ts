import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { updateAdminCarrierOpsFields } from "@/lib/data/carriers";
import { toErrorResponse } from "@/lib/errors";

const carrierInternalTagSchema = z.enum(["trusted", "probation", "flagged", "vip"]);
const updateCarrierNotesSchema = z.object({
  verificationNotes: z.string().max(280).optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
  internalTags: z.array(carrierInternalTagSchema).max(8).optional().nullable(),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireAdminUser();
    const payload = updateCarrierNotesSchema.parse(await request.json());
    const carrier = await updateAdminCarrierOpsFields({
      carrierId: params.id,
      verificationNotes: payload.verificationNotes ?? null,
      internalNotes: payload.internalNotes ?? null,
      internalTags: payload.internalTags ?? [],
      adminUserId: user.id,
    });

    return NextResponse.json({ carrier });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
