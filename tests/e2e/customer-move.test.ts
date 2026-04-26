import { test, expect } from "@playwright/test";

import { loginAsCustomer, logout } from "./helpers/auth";
import { MOCK_ADDRESSES, fillAddressField } from "./helpers/maps";
import { ROUTES } from "./helpers/seed";

// P0: Customer move wizard flows.
// These tests exercise the need-first wizard using mock-compatible address values.
// Real Maps autocomplete is not tested here (see the @real-maps tagged tests in maps.test.ts).

test.describe("customer move wizard", () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("move wizard route step loads for unauthenticated user", async ({ page }) => {
    // The wizard entry point (/move/new) is public — customers should be able to start without an account.
    await page.goto(ROUTES.moveNew);
    await expect(page).not.toHaveURL(/\/auth\/login/);
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 5_000 });
  });

  test("customer can reach route step and fill addresses", async ({ page }) => {
    await page.goto(ROUTES.moveRoute);

    // Route step must present at least one address input.
    const pickupInput = page.getByRole("textbox", { name: /pickup|from|origin/i })
      .or(page.locator('input[name*="pickup"], input[placeholder*="pickup"], input[placeholder*="from"]'))
      .first();

    await expect(pickupInput).toBeVisible({ timeout: 5_000 });
    await fillAddressField(page, 'input[placeholder*="pickup"], input[placeholder*="from"], input[name*="pickup"]', MOCK_ADDRESSES.pickup);

    const dropoffInput = page.getByRole("textbox", { name: /dropoff|to|destination/i })
      .or(page.locator('input[name*="dropoff"], input[placeholder*="dropoff"], input[placeholder*="to"]'))
      .first();

    // If dropoff is on the same step, fill it too.
    if (await dropoffInput.count() > 0) {
      await fillAddressField(page, 'input[placeholder*="dropoff"], input[placeholder*="to"], input[name*="dropoff"]', MOCK_ADDRESSES.dropoff);
    }
  });

  test("customer move wizard reaches results or zero-match state without crash", async ({ page }) => {
    await loginAsCustomer(page);

    // Start the wizard.
    await page.goto(ROUTES.moveNew);
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Step through the wizard using the Continue/Next button where available.
    // We don't assert a specific end state because it depends on live seed data;
    // we assert no unhandled error pages appear.
    const continueBtn = page.getByRole("button", { name: /continue|next|search|find/i }).first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    }

    // Must not land on a generic error page.
    await expect(page).not.toHaveURL(/\/error|\/500/);
  });

  test("zero-match state renders an alert/save option, not a dead end", async ({ page }) => {
    await loginAsCustomer(page);

    // Navigate to the alert/save page directly — this is the no-match recovery path.
    await page.goto(ROUTES.moveAlert);

    // Page must not redirect to login or show a blank error.
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).not.toHaveURL(/\/error/);

    // There should be some recoverable content (heading or form).
    const content = page.getByRole("heading").or(page.getByRole("form")).first();
    await expect(content).toBeVisible({ timeout: 5_000 });
  });
});
