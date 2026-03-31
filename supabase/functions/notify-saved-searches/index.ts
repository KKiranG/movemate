import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (request) => {
  const payload = await request.json();
  const listing = payload.record;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: matches } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .ilike("from_suburb", `%${listing.origin_suburb}%`)
    .ilike("to_suburb", `%${listing.destination_suburb}%`);

  if (!matches || matches.length === 0) {
    return new Response(JSON.stringify({ notified: 0 }), { status: 200 });
  }

  let notified = 0;

  for (const search of matches) {
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      continue;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") ?? "hello@moverrr.com.au",
        to: [search.notify_email],
        subject: "A trip matching your search just posted on moverrr",
        html: `
          <p>${listing.origin_suburb} to ${listing.destination_suburb} just posted on moverrr.</p>
          <p>${listing.trip_date} · $${Math.round(listing.price_cents / 100)} · Space ${listing.space_size}</p>
          <p><a href="${Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"}/trip/${listing.id}">View trip</a></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      continue;
    }

    await supabase
      .from("saved_searches")
      .update({
        last_notified_at: new Date().toISOString(),
        notification_count: search.notification_count + 1,
        is_active: search.notification_count + 1 < 5,
      })
      .eq("id", search.id);

    notified += 1;
  }

  return new Response(JSON.stringify({ notified }), { status: 200 });
});
