import { Resend } from "resend";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasResendEnv } from "@/lib/env";
import { buildEmailHtml } from "@/lib/email";
import { captureAppError } from "@/lib/sentry";
import type { Database } from "@/types/database";

function getResendClient() {
  if (!hasResendEnv()) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    return { skipped: true };
  }

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });

  if (result.error) {
    captureAppError(result.error, {
      feature: "notifications",
      action: "sendTransactionalEmail",
      tags: { subject: params.subject },
    });
  }

  return result;
}

function getResendMessageId(result: unknown) {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    typeof (result as { data?: unknown }).data === "object" &&
    (result as { data?: { id?: unknown } }).data !== null &&
    typeof (result as { data?: { id?: unknown } }).data?.id === "string"
  ) {
    return (result as { data: { id: string } }).data.id;
  }

  return null;
}

export async function sendBookingTransactionalEmail(params: {
  bookingId: string;
  bookingStatus?: Database["public"]["Tables"]["bookings"]["Row"]["status"] | null;
  emailType: string;
  to: string;
  subject: string;
  html: string;
}) {
  const dedupeKey = [
    params.bookingId,
    params.emailType,
    params.bookingStatus ?? "none",
    params.to.toLowerCase(),
  ].join(":");

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return sendTransactionalEmail(params);
  }

  const supabase = createAdminClient();
  const { data: insertedRow, error: insertError } = await supabase
    .from("booking_email_deliveries")
    .insert({
      booking_id: params.bookingId,
      recipient_email: params.to.toLowerCase(),
      email_type: params.emailType,
      booking_status: params.bookingStatus ?? null,
      dedupe_key: dedupeKey,
      provider: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { skipped: true, deduped: true };
    }

    captureAppError(insertError, {
      feature: "notifications",
      action: "booking_email_dedupe_insert",
      tags: { bookingId: params.bookingId, emailType: params.emailType },
    });

    return sendTransactionalEmail(params);
  }

  const result = await sendTransactionalEmail(params);
  const wasSkipped =
    typeof result === "object" &&
    result !== null &&
    "skipped" in result &&
    Boolean((result as { skipped?: boolean }).skipped);
  const hadError =
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    Boolean((result as { error?: unknown }).error);

  if (wasSkipped || hadError) {
    await supabase.from("booking_email_deliveries").delete().eq("id", insertedRow.id);
    return result;
  }

  await supabase
    .from("booking_email_deliveries")
    .update({
      provider: "resend",
      provider_message_id: getResendMessageId(result),
    })
    .eq("id", insertedRow.id);

  return result;
}

export async function sendRequestLifecycleEmail(params: {
  bookingRequestId: string;
  to: string;
  subject: string;
  title: string;
  intro: string;
  routeLabel: string;
  itemLabel: string;
  statusLabel: string;
  ctaPath: string;
  ctaLabel: string;
  bodyLines?: string[];
}) {
  return sendTransactionalEmail({
    to: params.to,
    subject: params.subject,
    html: buildEmailHtml({
      eyebrow: "Request update",
      title: params.title,
      intro: params.intro,
      summaryRows: [
        { label: "Request", value: params.bookingRequestId.slice(0, 8).toUpperCase() },
        { label: "Route", value: params.routeLabel },
        { label: "Item", value: params.itemLabel },
        { label: "Status", value: params.statusLabel },
      ],
      bodyLines: params.bodyLines,
      ctaHref: new URL(params.ctaPath, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString(),
      ctaLabel: params.ctaLabel,
      closingNote:
        "Keep replies, payment changes, and any disputes inside MoveMate so the request and booking trail stay usable.",
    }),
  });
}

export async function sendAlertLifecycleEmail(params: {
  to: string;
  subject: string;
  title: string;
  intro: string;
  routeLabel: string;
  ctaPath: string;
  ctaLabel: string;
  bodyLines?: string[];
}) {
  return sendTransactionalEmail({
    to: params.to,
    subject: params.subject,
    html: buildEmailHtml({
      eyebrow: "Route alert",
      title: params.title,
      intro: params.intro,
      summaryRows: [{ label: "Route", value: params.routeLabel }],
      bodyLines: params.bodyLines,
      ctaHref: new URL(params.ctaPath, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString(),
      ctaLabel: params.ctaLabel,
      closingNote:
        "Alerts are meant to carry the same move intent forward when spare-capacity supply is not immediately available.",
    }),
  });
}

export async function sendTripFreshnessNotification(params: {
  to: string;
  subject: string;
  title: string;
  intro: string;
  routeLabel: string;
  ctaPath: string;
  ctaLabel: string;
}) {
  return sendTransactionalEmail({
    to: params.to,
    subject: params.subject,
    html: buildEmailHtml({
      eyebrow: "Trip freshness",
      title: params.title,
      intro: params.intro,
      summaryRows: [{ label: "Route", value: params.routeLabel }],
      ctaHref: new URL(params.ctaPath, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString(),
      ctaLabel: params.ctaLabel,
    }),
  });
}
