import { NextResponse } from "next/server";

import requiredProductionEnv from "../../../../config/required-production-env.json";
import { getStripeServerClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { hasStripeEnv, hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";

export async function GET() {
  const missingEnv = (requiredProductionEnv as string[]).filter((key) => !process.env[key]);
  const envStatus: "ok" | "error" = missingEnv.length === 0 ? "ok" : "error";
  let dbStatus: "ok" | "error" = "error";
  let stripeStatus: "configured" | "missing" | "error" = hasStripeEnv() ? "configured" : "missing";
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
      dbStatus = "ok";
    }
  }

  if (hasStripeEnv()) {
    try {
      const stripe = getStripeServerClient();
      await stripe.balance.retrieve();
      stripeStatus = "configured";
    } catch {
      stripeStatus = "error";
    }
  }

  const failing = [
    envStatus === "error" ? "env" : null,
    dbStatus === "error" ? "db" : null,
    stripeStatus === "error" ? "stripe" : null,
    stripeStatus === "missing" ? "stripe" : null,
  ].filter(Boolean);

  return NextResponse.json(
    {
      env: envStatus,
      db: dbStatus,
      stripe: stripeStatus,
      timestamp,
      failing,
      status: failing.length === 0 ? "ok" : "degraded",
      missingEnv,
    },
    { status: failing.length === 0 ? 200 : 503 },
  );
}
