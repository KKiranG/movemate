import Link from "next/link";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/search", label: "Browse trips" },
  { href: "/saved-searches", label: "Saved searches" },
  { href: "/carrier/dashboard", label: "Carrier" },
  { href: "/admin/dashboard", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex flex-col">
          <span className="font-heading text-xl tracking-[-0.04em] text-text">
            moverrr
          </span>
          <span className="text-xs text-text-secondary">
            Spare capacity for big stuff
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-text-secondary sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2 py-1 transition-colors hover:text-text active:bg-black/[0.04] active:text-text dark:hover:text-text dark:active:bg-white/[0.08]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Post a trip</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
