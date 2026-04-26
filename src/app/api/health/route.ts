import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

import requiredProductionEnv from "../../../../config/required-production-env.json";
import { getStripeServerClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { hasStripeEnv, hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";

export async function GET() {
  const missingEnv = (requiredProductionEnv as string[]).filter((key) => !process.env[key]);
  const envStatus: "ok" | "degraded" = missingEnv.length === 0 ? "ok" : "degraded";
  let supabaseStatus: "ok" | "degraded" = "degraded";
  let stripeStatus: "ok" | "degraded" = "degraded";
  let redisStatus: "ok" | "degraded" | "not_configured" = "not_configured";
  const timestamp = new Date().toISOString();

  if (hasSupabaseEnv()) {
    const supabase = hasSupabaseAdminEnv()
      ? createAdminClient()
      : createServerSupabaseClient();

    const { error } = await supabase
      .from("capacity_listings")
      .select("id", { head: true })
      .limit(1);

    if (!error) {
      supabaseStatus = "ok";
    }
  }

  if (hasStripeEnv()) {
    try {
      const stripe = getStripeServerClient();
      await stripe.balance.retrieve();
      stripeStatus = "ok";
    } catch {
      stripeStatus = "degraded";
    }
  }

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = Redis.fromEnv();
      await redis.get("__moverrr_healthcheck__");
      redisStatus = "ok";
    } catch {
      redisStatus = "degraded";
    }
  }

  const failing = [
    envStatus === "degraded" ? "env" : null,
    supabaseStatus === "degraded" ? "supabase" : null,
    stripeStatus === "degraded" ? "stripe" : null,
    redisStatus === "degraded" ? "redis" : null,
  ].filter(Boolean);
  const overall = failing.length === 0 ? "ok" : "degraded";

  return NextResponse.json(
    {
      overall,
      supabase: supabaseStatus,
      stripe: stripeStatus,
      redis: redisStatus,
      components: {
        env: envStatus,
        supabase: supabaseStatus,
        stripe: stripeStatus,
        redis: redisStatus,
      },
      env: envStatus,
      db: supabaseStatus,
      timestamp,
      failing,
      status: overall,
      missingEnv,
    },
    { status: overall === "ok" ? 200 : 503 },
  );
}
