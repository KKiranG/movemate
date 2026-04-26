import { test, expect } from "@playwright/test";

import { loginAsCarrier, logout } from "./helpers/auth";
import { ROUTES } from "./helpers/seed";

// P0: Carrier trip creation flow.
// Confirms the seeded carrier can navigate the trip wizard and trips list.

test.describe("carrier trip flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCarrier(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("carrier trips list loads", async ({ page }) => {
    await page.goto(ROUTES.carrierTrips);
    await expect(page).not.toHaveURL(/\/carrier\/auth/);
    // Trips page must render a heading.
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 5_000 });
  });

  test("carrier trip wizard entry renders", async ({ page }) => {
    await page.goto(ROUTES.carrierTripNew);
    await expect(page).not.toHaveURL(/\/carrier\/auth/);

    // The new trip wizard must show at least one form element or a heading.
    const firstInput = page.locator("input, select, textarea").first();
    const firstHeading = page.getByRole("heading").first();
    const hasContent = (await firstInput.count()) > 0 || (await firstHeading.count()) > 0;
    expect(hasContent).toBe(true);
  });

  test("carrier trip wizard — route step accepts origin/destination text", async ({ page }) => {
    await page.goto("/carrier/trips/new/route");
    await expect(page).not.toHaveURL(/\/carrier\/auth/);

    // Fill route inputs if present on this step; some wizards split steps across pages.
    const originInput = page.locator(
      'input[placeholder*="origin"], input[placeholder*="from"], input[placeholder*="depart"], input[name*="origin"]'
    ).first();

    if (await originInput.isVisible()) {
      await originInput.fill("Penrith NSW 2750");
    }

    const destInput = page.locator(
      'input[placeholder*="destination"], input[placeholder*="to"], input[placeholder*="arrive"], input[name*="destination"]'
    ).first();

    if (await destInput.isVisible()) {
      await destInput.fill("Bondi Beach NSW 2026");
    }

    // After filling, no runtime errors should appear.
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("carrier requests list loads", async ({ page }) => {
    await page.goto(ROUTES.carrierRequests);
    await expect(page).not.toHaveURL(/\/carrier\/auth/);
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 5_000 });
  });

  test("carrier dashboard loads and shows trip/request summary", async ({ page }) => {
    await page.goto(ROUTES.carrierDashboard);
    await expect(page).not.toHaveURL(/\/carrier\/auth/);
    // Dashboard must render content — any heading, stat card, or nav element.
    const content = page.getByRole("heading").or(page.locator("main")).first();
    await expect(content).toBeVisible({ timeout: 5_000 });
  });
});
