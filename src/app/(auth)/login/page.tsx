import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/layout/page-intro";
import { ConfigBanner } from "@/components/shared/config-banner";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to manage bookings, alerts, or carrier work on moverrr.",
};

export default function LoginPage() {
  const showDevBanner = process.env.NODE_ENV === "development" && !hasSupabaseEnv();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Auth"
        title="Log in to continue a booking or manage trips"
        description="Supabase email and password auth is the default for MVP, with route protection across customer, carrier, and admin flows."
      />

      {showDevBanner ? (
        <ConfigBanner message="Login requires Supabase environment variables before it can authenticate users." />
      ) : null}

      <Card className="p-4">
        {hasSupabaseEnv() ? <LoginForm /> : <Button className="w-full" disabled>Continue</Button>}
      </Card>
    </main>
  );
}
