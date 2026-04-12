"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
};

export function MobileNav({
  navItems,
  authCopy,
  isLoggedIn,
  postTripHref,
  postTripLabel,
}: {
  navItems: NavItem[];
  authCopy: string;
  isLoggedIn: boolean;
  postTripHref: string;
  postTripLabel: string;
}) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    detailsRef.current?.removeAttribute("open");
  }

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <details ref={detailsRef} className="group sm:hidden">
      <summary className="flex min-h-[44px] list-none items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-black/[0.02] active:bg-black/[0.05] dark:hover:bg-white/[0.04] dark:active:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
        <span>{isLoggedIn ? "Menu" : "Menu and account"}</span>
        <span className="text-xs uppercase tracking-[0.16em] text-text-secondary group-open:hidden">
          Open
        </span>
        <span className="hidden text-xs uppercase tracking-[0.16em] text-text-secondary group-open:inline">
          Close
        </span>
      </summary>
      <div className="mt-3 space-y-4 rounded-2xl border border-border bg-background p-4 pb-[env(safe-area-inset-bottom)]">
        <div className="grid gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="flex min-h-[44px] items-center rounded-xl px-3 py-3 text-sm text-text-secondary transition-colors hover:bg-black/[0.02] hover:text-text active:bg-black/[0.05] active:text-text dark:hover:bg-white/[0.04] dark:active:bg-white/[0.08]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          {isLoggedIn ? (
            <p className="break-all text-sm text-text-secondary">{authCopy}</p>
          ) : null}

          <div className="flex flex-col gap-2">
            {isLoggedIn ? (
              <LogoutButton />
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="justify-start"
              >
                <Link href="/login" onClick={closeMenu}>
                  Log in
                </Link>
              </Button>
            )}
            <Button asChild size="sm" className="justify-start">
              <Link href={postTripHref} onClick={closeMenu}>
                {postTripLabel}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </details>
  );
}
