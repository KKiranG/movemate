import Link from "next/link";

import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierSignupPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Carrier signup"
      title="Create your carrier account"
      description="Account creation is quick; activation details happen in the next flow."
      actions={[{ href: "/carrier/activate", label: "Create and continue", tone: "primary", operational: true }]}
    >
      <ScaffoldCard title="Already registered?">
        <Link
          href="/carrier/auth/login"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-4 text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
        >
          Log in instead
        </Link>
      </ScaffoldCard>
    </CarrierScaffoldPage>
  );
}
