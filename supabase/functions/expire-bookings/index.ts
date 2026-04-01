import { createClient } from "npm:@supabase/supabase-js@2";

type PendingBookingRow = {
  id: string;
  listing_id: string;
  customer_id: string;
  carrier_id: string;
  booking_reference: string;
  status: string;
  customer: { email?: string | null } | null;
  carrier: { email?: string | null } | null;
};

const EXPIRY_REASON = "Expired after the 2-hour pending response window.";

function getEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseUrl() {
  return Deno.env.get("SUPABASE_URL") ?? getEnv("NEXT_PUBLIC_SUPABASE_URL");
}

async function sendEmail(params: {
  supabase: ReturnType<typeof createClient>;
  bookingId: string;
  bookingReference: string;
  to: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");

  if (!resendApiKey || !resendFromEmail) {
    return { skipped: true };
  }

  const dedupeKey = [
    params.bookingId,
    "pending_booking_expired",
    "cancelled",
    params.to.toLowerCase(),
  ].join(":");

  const { error: insertError } = await params.supabase
    .from("booking_email_deliveries")
    .insert({
      booking_id: params.bookingId,
      recipient_email: params.to.toLowerCase(),
      email_type: "pending_booking_expired",
      booking_status: "cancelled",
      dedupe_key: dedupeKey,
      provider: "pending",
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { skipped: true, deduped: true };
    }

    throw insertError;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [params.to],
      subject: `Pending booking expired: ${params.bookingReference}`,
      html: `<p>Booking <strong>${params.bookingReference}</strong> expired after the 2-hour carrier response window and has been cancelled. Capacity has been released back to the trip.</p>`,
    }),
  });

  if (!response.ok) {
    await params.supabase
      .from("booking_email_deliveries")
      .delete()
      .eq("dedupe_key", dedupeKey);
    throw new Error(`Resend request failed with ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as { id?: string } | null;

  await params.supabase
    .from("booking_email_deliveries")
    .update({
      provider: "resend",
      provider_message_id: payload?.id ?? null,
    })
    .eq("dedupe_key", dedupeKey);

  return { sent: true };
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      getSupabaseUrl(),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, listing_id, customer_id, carrier_id, booking_reference, status, customer:customers(email), carrier:carriers(email)")
      .eq("status", "pending")
      .lte("pending_expires_at", now)
      .order("pending_expires_at", { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    const expiredBookingIds: string[] = [];

    for (const booking of (data ?? []) as PendingBookingRow[]) {
      const { data: cancelledBooking, error: cancelError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: now,
          cancellation_reason: EXPIRY_REASON,
        })
        .eq("id", booking.id)
        .eq("status", "pending")
        .select("id, listing_id, booking_reference")
        .maybeSingle();

      if (cancelError) {
        throw cancelError;
      }

      if (!cancelledBooking) {
        continue;
      }

      await supabase.from("booking_events").insert([
        {
          booking_id: booking.id,
          actor_role: "admin",
          event_type: "status_cancelled",
          metadata: {
            previousStatus: "pending",
            cancellationReason: EXPIRY_REASON,
          },
        },
        {
          booking_id: booking.id,
          actor_role: "admin",
          event_type: "pending_booking_expired",
          metadata: {
            expiredAt: now,
            reason: EXPIRY_REASON,
          },
        },
      ]);

      const { error: recalcError } = await supabase.rpc("recalculate_listing_capacity", {
        p_listing_id: booking.listing_id,
      });

      if (recalcError) {
        throw recalcError;
      }

      const recipients = [booking.customer?.email, booking.carrier?.email].filter(
        (email): email is string => Boolean(email),
      );

      await Promise.all(
        recipients.map((email) =>
          sendEmail({
            supabase,
            bookingId: booking.id,
            bookingReference: booking.booking_reference,
            to: email,
          }),
        ),
      );

      expiredBookingIds.push(booking.id);
    }

    return Response.json({
      expiredCount: expiredBookingIds.length,
      expiredBookingIds,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown expiry runner error.",
      },
      { status: 500 },
    );
  }
});
