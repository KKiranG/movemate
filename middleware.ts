import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getAdminEmails, hasSupabaseEnv } from "@/lib/env";

const protectedPrefixes = ["/bookings", "/carrier", "/admin"];
const csrfProtectedPrefixes = ["/api/bookings", "/api/payments"];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    request.method === "POST" &&
    pathname !== "/api/payments/webhook" &&
    csrfProtectedPrefixes.some((prefix) => pathname.startsWith(prefix)) &&
    !hasValidOrigin(request)
  ) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  if (!protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

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
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (
    pathname.startsWith("/admin") &&
    !getAdminEmails().includes((user.email ?? "").toLowerCase())
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/bookings/:path*",
    "/carrier/:path*",
    "/admin/:path*",
    "/api/bookings/:path*",
    "/api/payments/:path*",
  ],
};
