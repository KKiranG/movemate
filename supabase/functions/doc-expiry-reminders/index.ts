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

  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
  const dayTargets = [30, 7];
  let emailed = 0;

  for (const days of dayTargets) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const iso = target.toISOString().split("T")[0];

    const { data: carriers } = await supabase
      .from("carriers")
      .select("id, business_name, email, licence_expiry_date, insurance_expiry_date")
      .or(`licence_expiry_date.eq.${iso},insurance_expiry_date.eq.${iso}`);

    for (const carrier of carriers ?? []) {
      const expiring = [
        carrier.licence_expiry_date === iso ? "licence" : null,
        carrier.insurance_expiry_date === iso ? "insurance" : null,
      ].filter(Boolean);

      if (!carrier.email || expiring.length === 0) {
        continue;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM_EMAIL") ?? "hello@moverrr.com.au",
          to: [carrier.email],
          subject: `Document reminder for ${carrier.business_name}`,
          html: `<p>Your ${expiring.join(" and ")} ${expiring.length > 1 ? "documents expire" : "document expires"} in ${days} days.</p><p>Please resubmit updated documents so your account stays verification-ready.</p><p><a href="${siteUrl}/carrier/onboarding">Update documents</a></p>`,
        }),
      });

      if (response.ok) {
        emailed += 1;
      }
    }
  }

  return Response.json({ emailed });
});
