import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { captureAppError } from "@/lib/sentry";

export async function trackAnalyticsEvent(params: {
  eventName: string;
  userId?: string | null;
  sessionId?: string | null;
  pathname?: string | null;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("analytics_events").insert({
    event_name: params.eventName,
    user_id: params.userId ?? null,
    session_id: params.sessionId ?? null,
    pathname: params.pathname ?? null,
    dedupe_key: params.dedupeKey ?? null,
    metadata: params.metadata ?? {},
  });

  if (!error) {
    return;
  }

  if (error.code === "23505" && params.dedupeKey) {
    return;
  }

  captureAppError(error, {
    feature: "analytics",
    action: "track_event",
    tags: {
      eventName: params.eventName,
      pathname: params.pathname ?? "unknown",
    },
  });
}
