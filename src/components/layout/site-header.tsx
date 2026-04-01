import Link from "next/link";

import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import { getOptionalSessionUser, isAdminUser } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
};

export async function SiteHeader() {
  const user = await getOptionalSessionUser();
  const isAdmin = user ? await isAdminUser(user.id, user.email) : false;

  const navItems: NavItem[] = [
    { href: "/search", label: "Browse trips" },
    ...(user ? [{ href: "/saved-searches", label: "Saved searches" }] : []),
    { href: "/carrier/dashboard", label: "Carrier" },
    ...(isAdmin ? [{ href: "/admin/dashboard", label: "Admin" }] : []),
  ];

  const authCopy = user ? user.email ?? "Signed in" : "Log in";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-content flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 flex-col">
            <span className="font-heading text-xl tracking-[-0.04em] text-text">
              moverrr
            </span>
            <span className="hidden text-xs text-text-secondary sm:block">
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
            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <span className="hidden max-w-[220px] truncate rounded-full border border-border bg-surface px-3 py-2 text-xs text-text-secondary sm:inline-flex">
                  {authCopy}
                </span>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
              )}

              {user ? <LogoutButton /> : null}
            </div>

            <Button asChild size="sm">
              <Link href="/signup">Post a trip</Link>
            </Button>
          </div>
        </div>

        <details className="group sm:hidden">
          <summary className="flex min-h-[44px] list-none items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-black/[0.02] active:bg-black/[0.05] dark:hover:bg-white/[0.04] dark:active:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
            <span>{user ? "Menu" : "Menu and account"}</span>
            <span className="text-xs uppercase tracking-[0.16em] text-text-secondary">
              Open
            </span>
          </summary>
          <div className="mt-3 space-y-4 rounded-2xl border border-border bg-background p-4 pb-[env(safe-area-inset-bottom)]">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-[44px] items-center rounded-xl px-3 py-3 text-sm text-text-secondary transition-colors hover:bg-black/[0.02] hover:text-text active:bg-black/[0.05] active:text-text dark:hover:bg-white/[0.04] dark:active:bg-white/[0.08]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              {user ? (
                <p className="break-all text-sm text-text-secondary">
                  {authCopy}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                {user ? (
                  <LogoutButton />
                ) : (
                  <Button asChild variant="ghost" size="sm" className="justify-start">
                    <Link href="/login">Log in</Link>
                  </Button>
                )}
                <Button asChild size="sm" className="justify-start">
                  <Link href="/signup">Post a trip</Link>
                </Button>
              </div>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
