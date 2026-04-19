import Link from "next/link";

import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierLoginPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Carrier login"
      title="Welcome back"
      description="Continue where you left off in activation, requests, or trip operations."
      actions={[{ href: "/carrier", label: "Demo sign in", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Need an account?">
        <Link
          href="/carrier/auth/signup"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-4 text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
        >
          Go to signup
        </Link>
      </ScaffoldCard>
    </CarrierScaffoldPage>
  );
}
