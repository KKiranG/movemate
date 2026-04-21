import assert from "node:assert/strict";
import test from "node:test";

import { resolveSearchRecoveryCustomerId } from "@/app/api/search/route";

test("resolveSearchRecoveryCustomerId returns the marketplace customer id for a signed-in user", async () => {
  const customerId = await resolveSearchRecoveryCustomerId(
    "auth-user-123",
    async (userId) => (userId === "auth-user-123" ? "customer-search-1" : null),
  );
  assert.equal(customerId, "customer-search-1");
});

test("resolveSearchRecoveryCustomerId falls back to null when no customer profile exists", async () => {
  const customerId = await resolveSearchRecoveryCustomerId("missing-user", async () => null);
  assert.equal(customerId, null);
});

test("resolveSearchRecoveryCustomerId returns null for guest flows", async () => {
  const customerId = await resolveSearchRecoveryCustomerId(null);
  assert.equal(customerId, null);
});
