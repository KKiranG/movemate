import Link from "next/link";
import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { ConfigBanner } from "@/components/shared/config-banner";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Carrier signup",
  description:
    "Create a MoveMate carrier account, complete onboarding, and start posting real spare-capacity trips.",
};

const steps = [
  "Create your account and head straight into carrier onboarding.",
  "Upload business details, documents, and your active vehicle.",
  "Complete payout setup and publish real routes so matching requests can flow into carrier home.",
];

export default function CarrierSignupPage() {
  const showDevBanner = process.env.NODE_ENV === "development" && !hasSupabaseEnv();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier signup"
        title="Start as a MoveMate carrier"
        description="MoveMate is for carriers already making Sydney runs who want to fill spare room, not chase quote requests."
      />

      {showDevBanner ? (
        <ConfigBanner message="Carrier signup requires Supabase environment variables before accounts can be created." />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-4">
          <h2 className="text-lg text-text">What this path is for</h2>
          <div className="mt-4 grid gap-3 text-sm text-text-secondary">
            <p>Post routes you are already running and only review the requests that fit that spare capacity.</p>
            <p>Manual verification stays in the loop so early supply quality stays high.</p>
            <p>Payout setup happens before completed jobs can be released.</p>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg text-text">How it works</h2>
          <ol className="mt-4 grid gap-3 text-sm text-text-secondary">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="p-4">
        {hasSupabaseEnv() ? (
          <SignupForm defaultAccountType="carrier" lockAccountType />
        ) : null}
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/login" className="inline-flex min-h-[44px] items-center text-sm text-accent">
            Have an account? Log in
          </Link>
        </div>
      </Card>
    </main>
  );
}
