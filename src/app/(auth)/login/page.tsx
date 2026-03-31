import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/layout/page-intro";
import { ConfigBanner } from "@/components/shared/config-banner";
import { hasSupabaseEnv } from "@/lib/env";

export default function LoginPage() {
  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Auth"
        title="Log in to continue a booking or manage trips"
        description="Supabase email and password auth is the default for MVP, with route protection across customer, carrier, and admin flows."
      />

      {!hasSupabaseEnv() ? (
        <ConfigBanner message="Login requires Supabase environment variables before it can authenticate users." />
      ) : null}

      <Card className="p-4">
        {hasSupabaseEnv() ? <LoginForm /> : <Button className="w-full" disabled>Continue</Button>}
      </Card>
    </main>
  );
}
