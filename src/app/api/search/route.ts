import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { trackAnalyticsEvent } from "@/lib/analytics";
import { getOptionalSessionUser } from "@/lib/auth";
import { createUnmatchedRequest } from "@/lib/data/unmatched-requests";
import { getCustomerProfileForUser } from "@/lib/data/profiles";
import { hasMapsEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError, toErrorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { searchTrips } from "@/lib/data/trips";
import type { ItemCategory } from "@/types/trip";
import { geocodeAddress } from "@/lib/maps/geocode";
import { getSydneySuburbCoords } from "@/lib/maps/sydney-suburb-coords";
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

const unmatchedSearchSchema = z.object({
  email: z.string().email().optional(),
  from: z.string().min(2).max(120),
  to: z.string().min(2).max(120),
  itemCategory: z.enum(["furniture", "boxes", "appliance", "fragile", "other"]).optional(),
  preferredDate: z.string().min(1).optional(),
  notes: z.string().max(240).optional(),
});

async function resolveRoutePoint(suburb: string) {
  if (hasMapsEnv()) {
    try {
      const geocoded = await geocodeAddress(`${suburb}, Australia`);

      if (geocoded[0]) {
        return geocoded[0].location;
      }
    } catch {
      // Fall back to curated suburb coordinates below.
    }
  }

  const suburbCoords = getSydneySuburbCoords(suburb);

  if (suburbCoords) {
    return suburbCoords;
  }

  throw new AppError(
    "Could not resolve one of those suburbs. Try a specific Sydney suburb name.",
    400,
    "invalid_search_route",
  );
}

export async function resolveSearchRecoveryCustomerId(
  userId: string | null,
  lookupCustomerId = async (nextUserId: string) => {
    const customer = await getCustomerProfileForUser(nextUserId);
    return customer?.id ?? null;
  },
) {
  if (!userId) {
    return null;
  }

  return lookupCustomerId(userId);
}

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

    const body = unmatchedSearchSchema.parse(await request.json());
    const user = await getOptionalSessionUser();
    const customerId = await resolveSearchRecoveryCustomerId(user?.id ?? null);

    if (!user && !body.email) {
      throw new AppError("Email is required to keep you posted on this route.", 400, "email_required");
    }

    const [pickup, dropoff] = await Promise.all([
      resolveRoutePoint(body.from),
      resolveRoutePoint(body.to),
    ]);

    const unmatchedRequest = await createUnmatchedRequest({
      customerId,
      pickupSuburb: sanitizeText(body.from),
      pickupLatitude: pickup.lat,
      pickupLongitude: pickup.lng,
      dropoffSuburb: sanitizeText(body.to),
      dropoffLatitude: dropoff.lat,
      dropoffLongitude: dropoff.lng,
      itemCategory: body.itemCategory ?? "other",
      itemDescription:
        body.notes && body.notes.trim().length > 0
          ? sanitizeText(body.notes)
          : `${sanitizeText(body.itemCategory ?? "other")} move from ${sanitizeText(body.from)} to ${sanitizeText(body.to)}`,
      preferredDate: body.preferredDate,
      notifyEmail: user?.email ?? body.email,
      status: "active",
    });

    return NextResponse.json({
      ok: true,
      unmatchedRequest,
      message: "Route request saved. moverrr will use it for alerts and concierge follow-up.",
    });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
