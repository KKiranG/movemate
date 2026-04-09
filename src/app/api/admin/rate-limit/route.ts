import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toErrorResponse } from "@/lib/errors";

const rateLimitOverrideSchema = z.object({
  actorType: z.enum(["user", "ip"]),
  actorValue: z.string().trim().min(1).max(120),
  endpointKey: z.string().trim().min(1).max(120).optional(),
  overrideLimit: z.number().int().min(1).max(5000),
  windowMs: z.number().int().min(1_000).max(7 * 24 * 60 * 60 * 1000),
  expiresAt: z.string().datetime({ offset: true }),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const payload = rateLimitOverrideSchema.parse(await request.json());

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("rate_limit_overrides")
      .insert({
        actor_type: payload.actorType,
        actor_value: payload.endpointKey
          ? `${payload.endpointKey}:${payload.actorValue}`
          : payload.actorValue,
        endpoint_key: payload.endpointKey ?? null,
        override_limit: payload.overrideLimit,
        window_ms: payload.windowMs,
        expires_at: payload.expiresAt,
        created_by: admin.id,
        note: payload.note ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ override: data });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
