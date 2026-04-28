import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { UnsafeUnwrappedCookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies() as unknown as UnsafeUnwrappedCookies;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          return;
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          return;
        }
      },
    },
  });
}
