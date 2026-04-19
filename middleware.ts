import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getAdminEmails, hasSupabaseEnv } from "@/lib/env";
import { CARRIER_HOST, CUSTOMER_HOSTS, resolveHostRouting } from "@/lib/host-routing";

const csrfProtectedPrefixes = ["/api/bookings", "/api/payments"];
const mutatingMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const HOST_PREFERENCE_COOKIE = "moverrr_host_preference";

type ShellPreference = "customer" | "carrier";

function hasValidOrigin(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!requestOrigin || !siteUrl) {
    return false;
  }

  try {
    return new URL(requestOrigin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}

function normalizeHost(rawHost: string | null) {
  if (!rawHost) return "";
  return rawHost.split(":")[0]?.trim().toLowerCase() ?? "";
}

function getShellFromHost(host: string): ShellPreference | null {
  if (host === CARRIER_HOST) {
    return "carrier";
  }

  if (CUSTOMER_HOSTS.has(host)) {
    return "customer";
  }

  return null;
}

function isCarrierPublicPath(pathname: string) {
  return pathname === "/carrier" || pathname.startsWith("/carrier/auth");
}

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/bookings")) {
    return true;
  }

  if (pathname.startsWith("/carrier")) {
    return !isCarrierPublicPath(pathname);
  }

  return false;
}

function getUserShellPreference(
  request: NextRequest,
  userMetadata: Record<string, unknown> | null | undefined,
): ShellPreference | null {
  const cookiePreference = request.cookies.get(HOST_PREFERENCE_COOKIE)?.value;

  if (cookiePreference === "customer" || cookiePreference === "carrier") {
    return cookiePreference;
  }

  const accountType = typeof userMetadata?.account_type === "string" ? userMetadata.account_type : null;
  if (accountType === "carrier") {
    return "carrier";
  }

  if (accountType === "customer") {
    return "customer";
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;
  const requestedHost = normalizeHost(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  );
  const requestedShell = getShellFromHost(requestedHost);
  const hostRoute = resolveHostRouting(request);

  if (hostRoute.action === "redirect" && hostRoute.redirectUrl) {
    return NextResponse.redirect(hostRoute.redirectUrl);
  }

  const pathname = hostRoute.pathname;
  const shouldRewrite = hostRoute.action === "rewrite";
  const rewrittenUrl = shouldRewrite ? new URL(pathname, request.url) : null;

  if (
    mutatingMethods.has(request.method) &&
    pathname !== "/api/payments/webhook" &&
    csrfProtectedPrefixes.some((prefix) => pathname.startsWith(prefix)) &&
    !hasValidOrigin(request)
  ) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  if (!hasSupabaseEnv()) {
    if (!shouldRewrite || !rewrittenUrl) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(rewrittenUrl);
  }

  const createPassThroughResponse = () =>
    shouldRewrite && rewrittenUrl
      ? NextResponse.rewrite(rewrittenUrl, { request })
      : NextResponse.next({ request });

  let response = createPassThroughResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = createPassThroughResponse();
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = createPassThroughResponse();
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && requestedShell) {
    const preferredShell = getUserShellPreference(
      request,
      user.user_metadata as Record<string, unknown> | null | undefined,
    );

    if (preferredShell && preferredShell !== requestedShell) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.hostname = preferredShell === "carrier" ? CARRIER_HOST : "moverrr.com";
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    response.cookies.set(HOST_PREFERENCE_COOKIE, requestedShell, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  if (!isProtectedPath(pathname)) {
    return response;
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("next", originalPathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (
    pathname.startsWith("/admin")
  ) {
    const adminEmailMatch = getAdminEmails().includes((user.email ?? "").toLowerCase());
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminEmailMatch && !adminRow) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/requests/:path*",
    "/trips/:path*",
    "/payouts/:path*",
    "/post/:path*",
    "/today/:path*",
    "/templates/:path*",
    "/account/:path*",
    "/onboarding/:path*",
    "/stats/:path*",
    "/activate/:path*",
    "/bookings/:path*",
    "/carrier",
    "/carrier/:path*",
    "/admin/:path*",
    "/api/bookings/:path*",
    "/api/payments/:path*",
  ],
};
