import type { NextRequest } from "next/server";

export type HostRouteResolution = {
  action: "next" | "rewrite" | "redirect";
  pathname: string;
  redirectUrl?: URL;
};

export const CARRIER_HOST = "carrier.moverrr.com";
export const CUSTOMER_HOSTS = new Set(["moverrr.com", "www.moverrr.com"]);
const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const CARRIER_ROOT_PREFIXES = [
  "/dashboard",
  "/requests",
  "/trips",
  "/payouts",
  "/post",
  "/today",
  "/templates",
  "/account",
  "/onboarding",
  "/stats",
  "/activate",
] as const;

const BYPASS_PREFIXES = ["/api", "/admin", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml"];
const CARRIER_PUBLIC_PREFIXES = [
  "/auth",
  "/login",
  "/signup",
  "/verify",
  "/reset-password",
  "/become-a-carrier",
  "/privacy",
  "/terms",
  "/trust",
] as const;

function normalizeHost(rawHost: string | null) {
  if (!rawHost) return "";
  return rawHost.split(":")[0]?.trim().toLowerCase() ?? "";
}

function isCarrierAuthPath(pathname: string) {
  return (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify" ||
    pathname === "/reset-password"
  );
}

function shouldBypass(pathname: string) {
  return BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isCarrierRootPath(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  return CARRIER_ROOT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function stripCarrierPrefix(pathname: string) {
  const stripped = pathname.slice("/carrier".length);
  return stripped.length > 0 ? stripped : "/";
}

function isCarrierPublicPath(pathname: string) {
  return CARRIER_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveHostRouting(request: NextRequest): HostRouteResolution {
  const pathname = request.nextUrl.pathname;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = normalizeHost(forwardedHost ?? request.headers.get("host"));

  if (shouldBypass(pathname)) {
    return { action: "next", pathname };
  }

  if (LOCAL_DEV_HOSTS.has(host) || host.endsWith(".localhost")) {
    return { action: "next", pathname };
  }

  if (host === CARRIER_HOST) {
    if (pathname === "/carrier" || pathname.startsWith("/carrier/")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = stripCarrierPrefix(pathname);
      return { action: "redirect", pathname, redirectUrl };
    }

    if (pathname === "/") {
      return { action: "rewrite", pathname: "/carrier" };
    }

    if (isCarrierAuthPath(pathname)) {
      if (pathname === "/login") {
        return { action: "rewrite", pathname: "/carrier/auth/login" };
      }

      if (pathname === "/signup") {
        return { action: "rewrite", pathname: "/carrier/auth/signup" };
      }

      if (pathname === "/verify" || pathname === "/reset-password") {
        return { action: "rewrite", pathname: "/carrier/auth" };
      }

      return { action: "rewrite", pathname: `/carrier${pathname}` };
    }

    if (isCarrierRootPath(pathname)) {
      return { action: "rewrite", pathname: `/carrier${pathname}` };
    }

    if (isCarrierPublicPath(pathname)) {
      return { action: "next", pathname };
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return { action: "redirect", pathname, redirectUrl };
  }

  if (CUSTOMER_HOSTS.has(host) && (pathname === "/carrier" || pathname.startsWith("/carrier/"))) {
    const carrierUrl = request.nextUrl.clone();
    carrierUrl.hostname = CARRIER_HOST;
    carrierUrl.pathname = stripCarrierPrefix(pathname);
    return { action: "redirect", pathname, redirectUrl: carrierUrl };
  }

  return { action: "next", pathname };
}
