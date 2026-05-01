"use client";

import { usePathname } from "next/navigation";

import { BottomTabBar } from "@/components/spec/chrome";

const customerTabRoots = new Set([
  "/",
  "/activity",
  "/inbox",
  "/account",
  "/bookings",
  "/alerts",
  "/saved-searches",
]);

function shouldShowCustomerTabs(pathname: string) {
  if (customerTabRoots.has(pathname)) {
    return true;
  }

  if (
    pathname.startsWith("/move/") ||
    pathname.startsWith("/bookings/") ||
    pathname.startsWith("/inbox/") ||
    pathname.startsWith("/account/")
  ) {
    return false;
  }

  return false;
}

export function CustomerShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabs = shouldShowCustomerTabs(pathname);

  return (
    <div className="app-shell app-scroll pb-28">
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {showTabs ? (
        <BottomTabBar
          pathname={pathname}
          tone="light"
          tabs={[
            { href: "/", label: "Home", icon: "home" },
            { href: "/activity", label: "Moves", icon: "activity" },
            { href: "/inbox", label: "Inbox", icon: "inbox" },
            { href: "/account", label: "Account", icon: "account" },
          ]}
        />
      ) : null}
    </div>
  );
}

export function CarrierShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell carrier-shell app-scroll pb-28">
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <BottomTabBar
        pathname={pathname}
        tone="light"
        tabs={[
          { href: "/carrier", label: "Home", icon: "home" },
          { href: "/carrier/requests", label: "Requests", icon: "requests" },
          { href: "/carrier/trips", label: "Trips", icon: "trips" },
          { href: "/carrier/payouts", label: "Payouts", icon: "payouts" },
          { href: "/carrier/account", label: "Account", icon: "account" },
        ]}
      />
    </div>
  );
}
