import { type Page, expect } from "@playwright/test";

import { ROUTES, SEED } from "./seed";

// Login as the seeded customer and return to the page after auth.
export async function loginAsCustomer(page: Page) {
  await page.goto(ROUTES.login);
  await page.getByRole("textbox", { name: /email/i }).fill(SEED.customer.email);
  await page.getByRole("textbox", { name: /password/i }).fill(SEED.customer.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  // Wait for redirect away from /auth/login — confirms auth succeeded.
  await expect(page).not.toHaveURL(/\/auth\/login/);
}

// Login as the seeded carrier through the carrier-specific auth page.
export async function loginAsCarrier(page: Page) {
  await page.goto(ROUTES.carrierAuthLogin);
  await page.getByRole("textbox", { name: /email/i }).fill(SEED.carrier.email);
  await page.getByRole("textbox", { name: /password/i }).fill(SEED.carrier.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/\/carrier\/auth/);
}

// Sign out via Supabase auth cookie removal (direct API call avoids UI flakiness).
// Fall back to navigating to a logout route if available.
export async function logout(page: Page) {
  await page.evaluate(() => {
    // Remove Supabase session cookies/storage — works for local Supabase auth.
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
  });
  await page.context().clearCookies();
}

// Assert an authenticated customer shell is visible (any protected customer page).
export async function expectCustomerShell(page: Page) {
  // Authenticated customer pages must not redirect to login.
  await expect(page).not.toHaveURL(/\/auth\/login/);
  // Should not show a generic "sign in" CTA that indicates a logged-out state.
  const signInLinks = page.getByRole("link", { name: /^sign in$/i });
  const count = await signInLinks.count();
  expect(count).toBe(0);
}

// Assert an authenticated carrier shell is visible.
export async function expectCarrierShell(page: Page) {
  await expect(page).not.toHaveURL(/\/carrier\/auth/);
}
