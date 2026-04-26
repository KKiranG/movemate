import { test, expect } from "@playwright/test";

import { loginAsCustomer, loginAsCarrier, logout, expectCustomerShell, expectCarrierShell } from "./helpers/auth";
import { ROUTES } from "./helpers/seed";

// P0: auth flows for seeded customer and carrier.
// Prerequisite: `npm run supabase:reset` (local) or `npm run e2e:reset` (cloud dev).

test.describe("customer auth", () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("customer can log in and reach authenticated shell", async ({ page }) => {
    await loginAsCustomer(page);
    // After login the app should land on a customer page (activity, bookings, or similar).
    await page.goto(ROUTES.customerActivity);
    await expectCustomerShell(page);
  });

  test("protected customer route redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto(ROUTES.customerBookings);
    // Must redirect to login when not authenticated.
    await expect(page).toHaveURL(/\/auth\/login|\/login/);
  });

  test("login page shows error on wrong password", async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByRole("textbox", { name: /email/i }).fill("customer@example.com");
    await page.getByRole("textbox", { name: /password/i }).fill("WrongPassword999!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Must stay on login and show an error.
    await expect(page).toHaveURL(/\/auth\/login|\/login/);
    const errorText = page.getByRole("alert").or(page.locator("[data-error], .error, [role='status']")).first();
    await expect(errorText).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("carrier auth", () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("carrier can log in and reach carrier dashboard", async ({ page }) => {
    await loginAsCarrier(page);
    await page.goto(ROUTES.carrierDashboard);
    await expectCarrierShell(page);
    // Dashboard must render without a redirect to the auth page.
    await expect(page).not.toHaveURL(/\/carrier\/auth/);
  });

  test("carrier pages redirect unauthenticated visitors", async ({ page }) => {
    await page.goto(ROUTES.carrierDashboard);
    await expect(page).toHaveURL(/\/carrier\/auth|\/auth\/login/);
  });
});
