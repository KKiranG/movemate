import { NextResponse } from "next/server";

import requiredProductionEnv from "../../../../config/required-production-env.json";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export async function GET() {
  const failing: string[] = [];

  const missingEnv = (requiredProductionEnv as string[]).filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    failing.push("env");
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    failing.push("stripe");
  }

  if (hasSupabaseEnv()) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("capacity_listings")
      .select("id", { count: "exact", head: true });

    if (error) {
      failing.push("supabase");
    }
  } else {
    failing.push("supabase");
  }

  if (failing.length > 0) {
    return NextResponse.json({ status: "degraded", failing }, { status: 503 });
  }

  return NextResponse.json({ status: "ok" });
}
