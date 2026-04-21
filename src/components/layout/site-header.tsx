import Link from "next/link";

import { LogoutButton } from "@/components/layout/logout-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { getOptionalSessionUser, isAdminUser } from "@/lib/auth";
import { listCarrierRequestCards } from "@/lib/data/booking-requests";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { listUnmatchedRequestsForCustomer } from "@/lib/data/unmatched-requests";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

type NavItem = {
  href: string;
  label: string;
  badgeCount?: number;
};

export async function SiteHeader() {
  const user = await getOptionalSessionUser();
  const carrier = user ? await getCarrierByUserId(user.id) : null;
  const isAdmin = user ? await isAdminUser(user.id, user.email) : false;
  const supabase = user ? createServerSupabaseClient() : null;
  const customer =
    user && !carrier && supabase
      ? await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle()
      : { data: null };
  const [carrierRequests, routeRequests] = await Promise.all([
    user && carrier ? listCarrierRequestCards(user.id) : Promise.resolve([]),
    customer.data?.id
      ? listUnmatchedRequestsForCustomer(customer.data.id)
      : Promise.resolve([]),
  ]);
  const primaryCtaHref = carrier ? "/carrier/post" : "/move/new/route";
  const primaryCtaLabel = carrier ? "Post a trip" : "Start a move";
  const matchedAlertCount = routeRequests.filter((request) => request.status === "matched").length;

  const navItems: NavItem[] = carrier
    ? [
        { href: "/carrier/dashboard", label: "Home" },
        {
          href: "/carrier/requests",
          label: "Requests",
          badgeCount: carrierRequests.length > 0 ? carrierRequests.length : undefined,
        },
        { href: "/carrier/trips", label: "Trips" },
        { href: "/carrier/payouts", label: "Payouts" },
        { href: "/carrier/account", label: "Account" },
        ...(isAdmin ? [{ href: "/admin/dashboard", label: "Admin" }] : []),
      ]
    : [
        { href: "/", label: "Home" },
        ...(user ? [{ href: "/bookings", label: "Bookings" }] : []),
        ...(user
          ? [
              {
                href: "/alerts",
                label: "Alerts",
                badgeCount: matchedAlertCount > 0 ? matchedAlertCount : undefined,
              },
            ]
          : []),
        ...(user ? [{ href: "/account", label: "Account" }] : [{ href: "/search", label: "Tell us your move" }]),
        {
          href: user ? "/carrier/onboarding" : "/become-a-carrier",
          label: "Drive with MoveMate",
        },
        ...(isAdmin ? [{ href: "/admin/dashboard", label: "Admin" }] : []),
      ];

  const authCopy = user ? user.email ?? "Signed in" : "Log in";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-content flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-[44px] flex-col justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            <span className="font-heading text-xl tracking-[-0.04em] text-text">
              MoveMate
            </span>
            <span className="hidden text-xs text-text-secondary sm:block">
              Need-first spare-capacity moves
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-text-secondary sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:bg-black/[0.04] active:text-text dark:hover:text-text dark:active:bg-white/[0.08]"
              >
                {item.label}
                {item.badgeCount ? (
                  <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                    {item.badgeCount}
                  </span>
                ) : null}
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
              <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
            </Button>
          </div>
        </div>

        <MobileNav
          navItems={navItems}
          authCopy={authCopy}
          isLoggedIn={Boolean(user)}
          primaryCtaHref={primaryCtaHref}
          primaryCtaLabel={primaryCtaLabel}
        />
      </div>
    </header>
  );
}
