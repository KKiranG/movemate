import Link from "next/link";
import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/layout/page-intro";
import { ConfigBanner } from "@/components/shared/config-banner";
import { hasSupabaseEnv } from "@/lib/env";

const roles = [
  {
    title: "Customer",
    description: "Declare a move need, review ranked matches, and keep route alerts active.",
  },
  {
    title: "Carrier",
    description: "Post real trips and review requests that fit spare room on those runs.",
  },
];

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a MoveMate account to book spare capacity or post your next carrier run.",
};

export default function SignupPage() {
  const showDevBanner = process.env.NODE_ENV === "development" && !hasSupabaseEnv();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Auth"
        title="Create an account"
        description="Customers need an account to manage bookings and alerts, and carriers need one to post trips and handle requests."
      />

      {showDevBanner ? (
        <ConfigBanner message="Signup requires Supabase environment variables before accounts can be created." />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.title} className="p-4">
            <h2 className="text-lg text-text">{role.title}</h2>
            <p className="mt-2 subtle-text">{role.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        {hasSupabaseEnv() ? <SignupForm /> : null}
        <div className="mt-4 border-t border-border pt-4">
          <Link href="/login" className="inline-flex min-h-[44px] items-center text-sm text-accent">
            Have an account? Log in
          </Link>
        </div>
      </Card>
    </main>
  );
}
