import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toErrorResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const payload = (await request.json()) as {
      actorType: "user" | "ip";
      actorValue: string;
      endpointKey?: string;
      overrideLimit: number;
      windowMs: number;
      expiresAt: string;
      note?: string;
    };

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
