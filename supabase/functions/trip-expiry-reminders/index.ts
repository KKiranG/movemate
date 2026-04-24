import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async () => {
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!resendKey) {
    return Response.json({ emailed: 0, skipped: "missing_resend" });
  }

  const start = new Date(Date.now() + 47 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString();
  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";

  const { data: trips } = await supabase
    .from("capacity_listings")
    .select("id, trip_date, origin_suburb, destination_suburb, carrier:carriers(email)")
    .in("status", ["active", "booked_partial"])
    .gte("expires_at", start)
    .lte("expires_at", end);

  let emailed = 0;

  for (const trip of trips ?? []) {
    const email = (trip.carrier as { email?: string } | null)?.email;

    if (!email) {
      continue;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") ?? "hello@movemate.app",
        to: [email],
        subject: `Listing expires soon: ${trip.origin_suburb} to ${trip.destination_suburb}`,
        html: `<p>Your MoveMate route for <strong>${trip.origin_suburb} to ${trip.destination_suburb}</strong> expires within 48 hours.</p><p><a href="${siteUrl}/carrier/post?from=${encodeURIComponent(trip.origin_suburb)}&to=${encodeURIComponent(trip.destination_suburb)}">Repost this route</a></p>`,
      }),
    });

    if (response.ok) {
      emailed += 1;
    }
  }

  return Response.json({ emailed });
});
