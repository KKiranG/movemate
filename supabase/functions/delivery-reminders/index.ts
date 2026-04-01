import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type BookingRow = {
  id: string;
  booking_reference: string;
  delivered_at: string | null;
  customer_confirmed_at: string | null;
  status: string;
  customer: { email?: string } | null;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

async function sendReminderEmail(to: string, bookingReference: string, hours: number) {
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!resendKey) {
    return false;
  }

  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") ?? "hello@moverrr.com.au",
      to: [to],
      subject: `Please confirm delivery for ${bookingReference}`,
      html: `<p>Your booking <strong>${bookingReference}</strong> was marked delivered ${hours} hour${hours === 1 ? "" : "s"} ago.</p><p>Please confirm receipt or raise a dispute if something is wrong.</p><p><a href="${siteUrl}/bookings">Open booking detail</a></p>`,
    }),
  });

  return response.ok;
}

Deno.serve(async () => {
  const now = new Date();
  const reminders = [2, 24];

  let emailed = 0;

  for (const hours of reminders) {
    const windowStart = new Date(now.getTime() - (hours + 1) * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, booking_reference, delivered_at, customer_confirmed_at, status, customer:customers(email)")
      .eq("status", "delivered")
      .is("customer_confirmed_at", null)
      .gte("delivered_at", windowStart)
      .lte("delivered_at", windowEnd);

    for (const booking of (bookings ?? []) as unknown as BookingRow[]) {
      const { data: openDispute } = await supabase
        .from("disputes")
        .select("id")
        .eq("booking_id", booking.id)
        .in("status", ["open", "investigating"])
        .maybeSingle();

      if (openDispute || !booking.customer?.email) {
        continue;
      }

      const didSend = await sendReminderEmail(
        booking.customer.email,
        booking.booking_reference,
        hours,
      );

      if (didSend) {
        await supabase.from("booking_events").insert({
          booking_id: booking.id,
          actor_role: "system",
          event_type: "delivery_confirmation_reminder_sent",
          metadata: { hoursAfterDelivered: hours },
        });
        emailed += 1;
      }
    }
  }

  return Response.json({ emailed });
});
