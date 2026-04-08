import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { trackAnalyticsEvent } from "@/lib/analytics";
import { hasSupabaseEnv } from "@/lib/env";
import { toErrorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { searchTrips } from "@/lib/data/trips";
import type { ItemCategory } from "@/types/trip";
import { sanitizeText } from "@/lib/utils";

export const revalidate = 30;

function buildSearchAnalyticsDedupeKey(
  request: NextRequest,
  params: {
    from: string;
    to: string;
    when?: string;
    what?: ItemCategory;
    isReturnTrip: boolean;
  },
) {
  const bucket = new Date().toISOString().slice(0, 16);
  const fingerprint = JSON.stringify({
    ip: request.ip ?? "anonymous",
    from: params.from.trim().toLowerCase(),
    to: params.to.trim().toLowerCase(),
    when: params.when ?? null,
    what: params.what ?? null,
    isReturnTrip: params.isReturnTrip,
    bucket,
  });

  return createHash("sha256").update(fingerprint).digest("hex");
}

const waitlistSchema = z.object({
  email: z.string().email(),
  from: z.string().min(2).max(120),
  to: z.string().min(2).max(120),
  itemCategory: z.string().min(2).max(60),
  preferredDate: z.string().min(1).optional(),
  notes: z.string().max(240).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const when = searchParams.get("when") ?? undefined;
    const isReturnTrip = searchParams.get("backload") === "1";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
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

    const searchResponse = await searchTrips({
      from,
      to,
      when,
      what,
      isReturnTrip,
      page,
    });

    await trackAnalyticsEvent({
      eventName: "search_submitted",
      pathname: "/search",
      dedupeKey: buildSearchAnalyticsDedupeKey(request, {
        from,
        to,
        when,
        what,
        isReturnTrip,
      }),
      metadata: {
        from,
        to,
        what: what ?? null,
        isReturnTrip,
        page,
        resultCount: searchResponse.results.length,
      },
    });

    return NextResponse.json(searchResponse);
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

    const body = waitlistSchema.parse(await request.json());

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("waitlist_entries").insert({
      email: body.email,
      from_location: sanitizeText(body.from),
      to_location: sanitizeText(body.to),
      item_category: sanitizeText(body.itemCategory),
      preferred_date: body.preferredDate ?? null,
      notes: body.notes ? sanitizeText(body.notes) : null,
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
