import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { getValidationMetrics } from "@/lib/data/admin";
import { bootstrapSmokeDataset } from "@/lib/data/bootstrap";
import { toErrorResponse } from "@/lib/errors";

const adminActionSchema = z.object({
  action: z.literal("bootstrap"),
  secret: z.string().min(1),
});

export async function GET() {
  try {
    await requireAdminUser();
    const metrics = await getValidationMetrics();

    return NextResponse.json({ metrics });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
    const payload = adminActionSchema.parse(await request.json());
    const result = await bootstrapSmokeDataset(payload.secret);
    return NextResponse.json({ result });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
