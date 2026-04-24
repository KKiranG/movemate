import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { updateCustomerProfileNameForUser } from "@/lib/data/profiles";
import { toErrorResponse } from "@/lib/errors";
import { sanitizeText } from "@/lib/utils";

const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const payload = profileUpdateSchema.parse(await request.json());
    const fullName = sanitizeText(`${payload.firstName} ${payload.lastName}`);
    const profile = await updateCustomerProfileNameForUser({
      userId: user.id,
      fullName,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
