import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "@/app/api/bookings/[id]/exception/route";

interface SupabaseEnvSnapshot {
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

function clearSupabaseEnv() {
  const snapshot: SupabaseEnvSnapshot = {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  return () => {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === undefined) {
        delete process.env[key];
        continue;
      }

      process.env[key] = value;
    }
  };
}

test("exception route requires an authenticated session", async () => {
  const restoreEnv = clearSupabaseEnv();

  try {
    const response = await POST(
      new Request("http://localhost/api/bookings/booking-1/exception", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          code: "damage",
          note: "Proof note",
          photoUrls: [],
        }),
      }) as never,
      { params: Promise.resolve({ id: "booking-1" }) },
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: "You need to log in first.",
    });
  } finally {
    restoreEnv();
  }
});
