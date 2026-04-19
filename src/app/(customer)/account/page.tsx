import Link from "next/link";
import { ChevronRight, Truck } from "lucide-react";

import { TopAppBar } from "@/components/spec/chrome";

const rows = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/payment", label: "Payment methods" },
  { href: "/account/help", label: "Notifications" },
  { href: "/account/help", label: "Help & policies" },
  { href: "/account/advanced", label: "Advanced" },
];

export default function AccountPage() {
  return (
    <main className="pb-8">
      <TopAppBar title="Account" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Customer account</p>
          <h1 className="heading">Trust, payments, and preferences</h1>
        </div>

        <div className="surface-1 space-y-1">
          <p className="title">Ava Parker</p>
          <p className="caption">ava@example.com</p>
          <p className="caption">Verified payment method ready</p>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <Link
              key={`${row.href}-${row.label}`}
              href={row.href}
              className="flex min-h-[54px] min-w-[44px] items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-4 text-[15px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-card)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
            >
              {row.label}
              <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
            </Link>
          ))}
        </div>

        <Link
          href="/carrier"
          className="flex min-h-[54px] items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-4 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-1)] active:bg-[var(--bg-elevated-2)]"
        >
          <Truck className="h-4 w-4" />
          Have spare space in your van? Drive with moverrr
        </Link>
      </section>
    </main>
  );
}
