import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { buildRouteAlertSearchHref } from "@/lib/alert-presenters";
import { getCorridorDemandSnapshot } from "@/lib/data/admin";
import { toGeographyPoint, toUnmatchedRequest } from "@/lib/data/mappers";
import { sendAlertLifecycleEmail } from "@/lib/notifications";
import { unmatchedRequestSchema, type UnmatchedRequestInput } from "@/lib/validation/unmatched-request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { MoveRequest } from "@/types/move-request";
import type { UnmatchedRequest } from "@/types/alert";
import type { Database } from "@/types/database";
import { getTodayIsoDate } from "@/lib/utils";

type UnmatchedRequestRow = Database["public"]["Tables"]["unmatched_requests"]["Row"];

export interface CorridorActivitySummary {
  upcomingTripCount: number;
  recentTripPostCount: number;
  openAlertCount: number | null;
  recentDemandCount: number | null;
}

export async function createUnmatchedRequest(params: UnmatchedRequestInput) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = unmatchedRequestSchema.safeParse(params);

  if (!parsed.success) {
    throw new AppError("Unmatched request payload is invalid.", 400, "invalid_unmatched_request");
  }

  if (!parsed.data.customerId && !hasSupabaseAdminEnv()) {
    throw new AppError(
      "Guest route requests need Supabase admin access to store unmatched demand.",
      503,
      "supabase_admin_unavailable",
    );
  }

  const supabase =
    parsed.data.customerId || !hasSupabaseAdminEnv()
      ? createServerSupabaseClient()
      : createAdminClient();
  const insertPayload: Database["public"]["Tables"]["unmatched_requests"]["Insert"] = {
    customer_id: parsed.data.customerId ?? null,
    move_request_id: parsed.data.moveRequestId ?? null,
    status: parsed.data.status,
    pickup_suburb: parsed.data.pickupSuburb,
    pickup_postcode: parsed.data.pickupPostcode ?? null,
    pickup_point: toGeographyPoint(parsed.data.pickupLongitude, parsed.data.pickupLatitude),
    dropoff_suburb: parsed.data.dropoffSuburb,
    dropoff_postcode: parsed.data.dropoffPostcode ?? null,
    dropoff_point: toGeographyPoint(parsed.data.dropoffLongitude, parsed.data.dropoffLatitude),
    item_category: parsed.data.itemCategory ?? null,
    item_description: parsed.data.itemDescription,
    preferred_date: parsed.data.preferredDate ?? null,
    notify_email: parsed.data.notifyEmail ?? null,
    expires_at: parsed.data.expiresAt,
  };

  const { data, error } = await supabase
    .from("unmatched_requests")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "unmatched_request_create_failed");
  }

  return toUnmatchedRequest(data as UnmatchedRequestRow);
}

export async function listUnmatchedRequestsForCustomer(customerId: string) {
  if (!hasSupabaseEnv()) {
    return [] as UnmatchedRequest[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("unmatched_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "unmatched_request_query_failed");
  }

  return (data ?? []).map((row) => toUnmatchedRequest(row as UnmatchedRequestRow));
}

export async function getCorridorActivitySummary(params: {
  pickupSuburb: string;
  dropoffSuburb: string;
}) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const recentTripSinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const recentDemandSinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = getTodayIsoDate();

  const [
    { count: upcomingTripCount, error: upcomingTripError },
    { count: recentTripPostCount, error: recentTripPostError },
    demandSnapshot,
  ] = await Promise.all([
    supabase
      .from("capacity_listings")
      .select("id", { count: "exact", head: true })
      .eq("origin_suburb", params.pickupSuburb)
      .eq("destination_suburb", params.dropoffSuburb)
      .in("status", ["active", "booked_partial"])
      .gte("trip_date", today),
    supabase
      .from("capacity_listings")
      .select("id", { count: "exact", head: true })
      .eq("origin_suburb", params.pickupSuburb)
      .eq("destination_suburb", params.dropoffSuburb)
      .gte("created_at", recentTripSinceIso),
    getCorridorDemandSnapshot({
      pickupSuburb: params.pickupSuburb,
      dropoffSuburb: params.dropoffSuburb,
      recentSinceIso: recentDemandSinceIso,
    }),
  ]);

  if (upcomingTripError) {
    throw new AppError(upcomingTripError.message, 500, "corridor_upcoming_trip_count_failed");
  }

  if (recentTripPostError) {
    throw new AppError(
      recentTripPostError.message,
      500,
      "corridor_recent_trip_post_count_failed",
    );
  }

  const summary = {
    upcomingTripCount: upcomingTripCount ?? 0,
    recentTripPostCount: recentTripPostCount ?? 0,
    openAlertCount: demandSnapshot?.openAlertCount ?? null,
    recentDemandCount: demandSnapshot?.recentDemandCount ?? null,
  } satisfies CorridorActivitySummary;

  if (
    summary.upcomingTripCount === 0 &&
    summary.recentTripPostCount === 0 &&
    summary.openAlertCount !== null &&
    summary.openAlertCount === 0 &&
    summary.recentDemandCount !== null &&
    summary.recentDemandCount === 0
  ) {
    return null;
  }

  return summary;
}

export async function getUnmatchedRequestByMoveRequestId(moveRequestId: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("unmatched_requests")
    .select("*")
    .eq("move_request_id", moveRequestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "unmatched_request_lookup_failed");
  }

  return data ? toUnmatchedRequest(data as UnmatchedRequestRow) : null;
}

export async function ensureRecoveryAlertForMoveRequest(params: {
  moveRequest: MoveRequest;
  notifyEmail?: string | null;
}) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const existing = await getUnmatchedRequestByMoveRequestId(params.moveRequest.id);

  if (existing && ["active", "notified", "matched"].includes(existing.status)) {
    return existing;
  }

  const supabase = createAdminClient();
  const insertPayload: Database["public"]["Tables"]["unmatched_requests"]["Insert"] = {
    customer_id: params.moveRequest.customerId,
    move_request_id: params.moveRequest.id,
    status: "active",
    pickup_suburb: params.moveRequest.route.pickupSuburb,
    pickup_postcode: params.moveRequest.route.pickupPostcode,
    pickup_point: toGeographyPoint(
      params.moveRequest.route.pickupLongitude,
      params.moveRequest.route.pickupLatitude,
    ),
    dropoff_suburb: params.moveRequest.route.dropoffSuburb,
    dropoff_postcode: params.moveRequest.route.dropoffPostcode,
    dropoff_point: toGeographyPoint(
      params.moveRequest.route.dropoffLongitude,
      params.moveRequest.route.dropoffLatitude,
    ),
    item_category: params.moveRequest.item.category,
    item_description: params.moveRequest.item.description,
    preferred_date: params.moveRequest.route.preferredDate ?? null,
    notify_email: params.notifyEmail ?? null,
  };

  const { data, error } = await supabase
    .from("unmatched_requests")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "unmatched_request_create_failed");
  }

  const unmatchedRequest = toUnmatchedRequest(data as UnmatchedRequestRow);

  if (params.notifyEmail) {
    await sendAlertLifecycleEmail({
      to: params.notifyEmail,
      subject: `Route alert active: ${params.moveRequest.route.pickupSuburb} to ${params.moveRequest.route.dropoffSuburb}`,
      title: "We saved your route for recovery alerts",
      intro:
        "That request did not convert into a booking, so moverrr is now keeping the move intent alive as a route alert.",
      routeLabel: `${params.moveRequest.route.pickupSuburb} to ${params.moveRequest.route.dropoffSuburb}`,
      ctaPath: "/alerts",
      ctaLabel: "Open alerts",
      bodyLines: [
        "You do not need to re-enter the whole move just to stay in the queue for matching spare-capacity supply.",
        "If a better fit appears later, moverrr can route you back into the same customer journey from alerts.",
      ],
    });
  }

  return unmatchedRequest;
}

export async function markRecoveryAlertMatched(moveRequestId: string) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const supabase = createAdminClient();
  const { data: existingRows, error: lookupError } = await supabase
    .from("unmatched_requests")
    .select("*")
    .eq("move_request_id", moveRequestId)
    .in("status", ["active", "notified"]);

  if (lookupError) {
    throw new AppError(lookupError.message, 500, "unmatched_request_match_lookup_failed");
  }

  const { error } = await supabase
    .from("unmatched_requests")
    .update({
      status: "matched",
      matched_at: new Date().toISOString(),
    })
    .eq("move_request_id", moveRequestId)
    .in("status", ["active", "notified"]);

  if (error) {
    throw new AppError(error.message, 500, "unmatched_request_match_update_failed");
  }

  await Promise.all(
    (existingRows ?? []).map(async (row) => {
      if (!row.notify_email) {
        return;
      }

      await sendAlertLifecycleEmail({
        to: row.notify_email,
        subject: `Recovered route match available: ${row.pickup_suburb} to ${row.dropoff_suburb}`,
        title: "A new match is ready for the same move request",
        intro:
          "moverrr found a viable route for the same move need, so you can reopen that request instead of starting from scratch.",
        routeLabel: `${row.pickup_suburb} to ${row.dropoff_suburb}`,
        ctaPath: buildRouteAlertSearchHref({
          pickupSuburb: row.pickup_suburb,
          dropoffSuburb: row.dropoff_suburb,
          preferredDate: row.preferred_date,
          itemCategory: row.item_category,
          moveRequestId: row.move_request_id,
          preferMoveRequest: true,
        }),
        ctaLabel: "Open recovered matches",
        bodyLines: [
          "You will land back on the same move request with the viable offers that now fit it.",
          "If one of those options looks right, continue the request flow without rebuilding the job details.",
        ],
      });
    }),
  );
}
