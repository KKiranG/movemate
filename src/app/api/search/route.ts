import { NextResponse, type NextRequest } from "next/server";

import { trackAnalyticsEvent } from "@/lib/analytics";
import { hasSupabaseEnv } from "@/lib/env";
import { toErrorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { searchTrips } from "@/lib/data/trips";
import type { ItemCategory } from "@/types/trip";

export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const when = searchParams.get("when") ?? undefined;
    const what = (searchParams.get("what") ?? undefined) as
      | ItemCategory
      | undefined;

    const rateLimit = await enforceRateLimit(
      `search:${request.ip ?? "anonymous"}`,
      40,
      60_000,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many searches. Please retry shortly." },
        { status: 429 },
      );
    }

    const results = await searchTrips({ from, to, when, what });

    await trackAnalyticsEvent({
      eventName: "search_submitted",
      pathname: "/search",
      metadata: {
        from,
        to,
        what: what ?? null,
        resultCount: results.length,
      },
    });

    return NextResponse.json({ results });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      email: string;
      from: string;
      to: string;
      itemCategory: string;
      preferredDate?: string;
      notes?: string;
    };

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("waitlist_entries").insert({
      email: body.email,
      from_location: body.from,
      to_location: body.to,
      item_category: body.itemCategory,
      preferred_date: body.preferredDate ?? null,
      notes: body.notes ?? null,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
