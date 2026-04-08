import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default function VerifyPage() {
  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Auth"
        title="Check your email"
        description="Email verification is part of the trust layer for both customers and carriers."
      />

      <Card className="p-4">
        <p className="subtle-text">
          After signup, Supabase sends the verification email. Once confirmed, customers can head
          back to search and carriers can continue to onboarding.
        </p>
      </Card>
    </main>
  );
}
