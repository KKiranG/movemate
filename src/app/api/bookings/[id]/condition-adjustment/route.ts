import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { createConditionAdjustmentForCarrier } from "@/lib/data/condition-adjustments";
import { toErrorResponse } from "@/lib/errors";
import { conditionAdjustmentCreateSchema } from "@/lib/validation/condition-adjustment";

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const payload = conditionAdjustmentCreateSchema.parse(await request.json());
    const adjustment = await createConditionAdjustmentForCarrier({
      userId: user.id,
      bookingId: params.id,
      reasonCode: payload.reasonCode,
      amountCents: payload.amountCents,
      note: payload.note,
    });

    return NextResponse.json({ adjustment });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
