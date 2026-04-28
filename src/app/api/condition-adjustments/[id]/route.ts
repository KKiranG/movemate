import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { respondToConditionAdjustment } from "@/lib/data/condition-adjustments";
import { toErrorResponse } from "@/lib/errors";
import { conditionAdjustmentResponseSchema } from "@/lib/validation/condition-adjustment";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const payload = conditionAdjustmentResponseSchema.parse(await request.json());
    const adjustment = await respondToConditionAdjustment({
      userId: user.id,
      adjustmentId: params.id,
      action: payload.action,
      customerResponseNote: payload.customerResponseNote,
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
