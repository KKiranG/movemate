import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { getMoveRequestByIdForCustomer } from "@/lib/data/move-requests";
import { requireCustomerProfileForUser } from "@/lib/data/profiles";
import { ensureRecoveryAlertForMoveRequest } from "@/lib/data/unmatched-requests";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { AppError, toErrorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";

const recoveryCreateSchema = z.object({
  moveRequestId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const rateLimit = await enforceRateLimit(`unmatched-request:move:${user.id}`, 10, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Alert request rate limit reached.", code: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))),
          },
        },
      );
    }

    if (!hasSupabaseAdminEnv()) {
      throw new AppError(
        "Supabase admin is not configured for route recovery alerts.",
        503,
        "supabase_admin_unavailable",
      );
    }

    const payload = recoveryCreateSchema.parse(await request.json());
    const customer = await requireCustomerProfileForUser(user.id);
    const moveRequest = await getMoveRequestByIdForCustomer(customer.id, payload.moveRequestId);

    if (!moveRequest) {
      throw new AppError("Move request not found.", 404, "move_request_not_found");
    }

    const unmatchedRequest = await ensureRecoveryAlertForMoveRequest({
      moveRequest,
      notifyEmail: user.email,
    });

    if (!unmatchedRequest) {
      throw new AppError(
        "Route recovery alert could not be created.",
        500,
        "unmatched_request_create_failed",
      );
    }

    return NextResponse.json({ unmatchedRequest });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
