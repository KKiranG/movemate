import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account",
  description: "View your moverrr account details and jump into bookings or alerts.",
};

export default async function CustomerAccountPage() {
  const user = await requirePageSessionUser();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Account"
        title="Your customer account"
        description="Use this space for your account details and the main customer shortcuts while the deeper account settings flow is still being realigned."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-4">
          <p className="section-label">Signed in as</p>
          <h2 className="mt-1 text-lg text-text">{user.email ?? "Customer account"}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            This account can manage bookings, route alerts, and future move requests.
          </p>
        </Card>

        <Card className="p-4">
          <p className="section-label">Quick links</p>
          <div className="mt-3 grid gap-2">
            <Link
              href="/bookings"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-3 text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            >
              Open bookings
            </Link>
            <Link
              href="/alerts"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-3 text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            >
              Open alerts
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-3 text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            >
              Start a new move
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
