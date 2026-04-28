import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { buildCarrierVerificationEmail } from "@/lib/email";
import { verifyCarrier } from "@/lib/data/carriers";
import { toErrorResponse } from "@/lib/errors";
import { sendTransactionalEmail } from "@/lib/notifications";

const verifyCarrierSchema = z.object({
  isApproved: z.boolean(),
  notes: z.string().max(280).optional(),
}).superRefine((value, ctx) => {
  if (!value.isApproved && !value.notes?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["notes"],
      message: "A rejection reason is required.",
    });
  }
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireAdminUser();
    const payload = verifyCarrierSchema.parse(await request.json());
    const carrier = await verifyCarrier({
      carrierId: params.id,
      isApproved: payload.isApproved,
      notes: payload.notes,
      adminUserId: user.id,
    });

    if (carrier.email) {
      await sendTransactionalEmail({
        to: carrier.email,
        subject: payload.isApproved
          ? `Carrier approved: ${carrier.businessName}`
          : `Carrier verification update: ${carrier.businessName}`,
        html: buildCarrierVerificationEmail({
          approved: payload.isApproved,
          businessName: carrier.businessName,
          notes: payload.notes,
        }),
      });
    }

    return NextResponse.json({ carrier });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
