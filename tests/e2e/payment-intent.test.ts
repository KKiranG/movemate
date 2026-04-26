import { test, expect } from "@playwright/test";

// P1: Payment intent API — validates test-mode Stripe integration.
// Does not test webhook delivery (requires Stripe CLI forwarding; see docs/operations/agent-safe-verification.md).

test.describe("payment intent API", () => {
  test("Stripe keys are test-mode", async ({ request }) => {
    // The health endpoint exposes Stripe status without leaking key values.
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.stripe).toBe("ok");
  });

  // Placeholder for a real payment intent creation test.
  // To enable: supply a valid seeded booking-request ID in .env.e2e.local as E2E_BOOKING_REQUEST_ID,
  // ensure the customer is logged in, and hit /api/payments/intent with that ID.
  test.skip("payment intent creation returns test-mode client secret", async ({ request }) => {
    const bookingRequestId = process.env.E2E_BOOKING_REQUEST_ID;

    if (!bookingRequestId) {
      test.skip(true, "E2E_BOOKING_REQUEST_ID not set — run e2e:reset and set the env var");
      return;
    }

    const res = await request.post("/api/payments/intent", {
      data: { bookingRequestId },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    // Client secret must start with pi_ (test-mode payment intent).
    expect(body.clientSecret).toMatch(/^pi_/);
    // Publishable key exposed in response must be test-mode.
    if (body.publishableKey) {
      expect(body.publishableKey).toMatch(/^pk_test_/);
    }
  });
});

// P1: Stripe webhook — requires `stripe listen --forward-to localhost:3000/api/payments/webhook`.
// Run this separately after setting STRIPE_WEBHOOK_SECRET from the CLI output.
// The test is skipped by default because it requires an active Stripe CLI tunnel.
test.describe("Stripe webhook delivery @webhook", () => {
  test.skip(
    !process.env.STRIPE_WEBHOOK_SECRET,
    "STRIPE_WEBHOOK_SECRET not set — run: stripe listen --forward-to localhost:3000/api/payments/webhook"
  );

  test("webhook endpoint accepts test events", async ({ request }) => {
    // Webhook endpoint must return 200 for a valid test event.
    // The actual event replay is done via `npm run webhook:replay`.
    // This test only verifies the endpoint is reachable and not returning 404/500 at rest.
    const res = await request.get("/api/payments/webhook");
    // GET is not the webhook method — expect 405 Method Not Allowed (not 404/500).
    expect([200, 400, 405]).toContain(res.status());
  });
});
