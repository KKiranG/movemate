import { test, expect } from "@playwright/test";

import { logout } from "./helpers/auth";
import { MOCK_ADDRESSES } from "./helpers/maps";
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

  test("customer can edit route and open item selection", async ({ page }) => {
    await page.goto(ROUTES.moveNew);

    const pickupInput = page.getByRole("textbox", { name: /pickup/i });
    const dropoffInput = page.getByRole("textbox", { name: /drop/i });

    await expect(pickupInput).toBeVisible({ timeout: 5_000 });
    await pickupInput.fill(MOCK_ADDRESSES.pickup);
    await dropoffInput.fill(MOCK_ADDRESSES.dropoff);

    await page.getByRole("button", { name: /select items/i }).click();
    await expect(page.getByRole("heading", { name: /what needs moving/i })).toBeVisible();
  });

  test("customer can click through Stitch mock flow to matches without crash", async ({ page }) => {
    await page.goto(ROUTES.moveNew);
    await expect(page).not.toHaveURL(/\/auth\/login/);

    await page.getByRole("button", { name: /start move request/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByRole("button", { name: /next: access details/i }).click();
    await page.getByRole("button", { name: /next: timing/i }).click();
    await page.getByRole("button", { name: /find available drivers/i }).click();

    await expect(page).not.toHaveURL(/\/error|\/500/);
    await expect(page.getByRole("heading", { name: /3 drivers ready/i })).toBeVisible();
  });

  test("customer can complete the primary Stitch request, tracking, review, and booking detail flow", async ({ page }) => {
    await page.goto(ROUTES.moveNew);

    await page.getByRole("button", { name: /start move request/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByRole("button", { name: /next: access details/i }).click();
    await page.getByRole("button", { name: /next: timing/i }).click();
    await page.getByRole("button", { name: /find available drivers/i }).click();
    await page.getByRole("button", { name: /request nadia/i }).click();
    await page.getByRole("button", { name: /send request/i }).click();

    await expect(page.getByRole("heading", { name: /asking nadia first/i })).toBeVisible();
    await page.getByRole("button", { name: /^accepted$/i }).click();
    await expect(page.getByRole("heading", { name: /nadia is heading to drop-off/i })).toBeVisible();

    await page.getByRole("button", { name: /view delivery proof/i }).click();
    await expect(page.getByRole("heading", { name: /delivered/i })).toBeVisible();
    await page.getByRole("button", { name: /confirm receipt/i }).click();
    await expect(page.getByRole("heading", { name: /bookings/i })).toBeVisible();

    await page.getByRole("button", { name: /^details$/i }).click();
    await expect(page.getByRole("heading", { name: /standard fabric sofa/i })).toBeVisible();
    await page.getByRole("button", { name: /^receipt$/i }).click();
    await expect(page.getByRole("heading", { name: /fixed-price move/i })).toBeVisible();
  });

  test("declined fallback and keep-looking path are reachable from the Stitch request flow", async ({ page }) => {
    await page.goto(ROUTES.moveNew);

    await page.getByRole("button", { name: /start move request/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.getByRole("button", { name: /next: access details/i }).click();
    await page.getByRole("button", { name: /next: timing/i }).click();
    await page.getByRole("button", { name: /find available drivers/i }).click();
    await page.getByRole("button", { name: /request nadia/i }).click();
    await page.getByRole("button", { name: /send request/i }).click();
    await page.getByRole("button", { name: /simulate decline/i }).click();

    await expect(page.getByRole("heading", { name: /two options left/i })).toBeVisible();
    await page.getByRole("button", { name: /keep looking instead/i }).click();
    await expect(page.getByRole("heading", { name: /keep looking for you/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /notify me when someone fits/i })).toBeVisible();
  });
});
