import { test, expect } from "@playwright/test";

import { ROUTES } from "./helpers/seed";

// P0: public routes load without JS errors and expose expected UI landmarks.

test.describe("public smoke", () => {
  test("homepage loads", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(ROUTES.home);
    await expect(page).toHaveTitle(/.+/);

    // Primary CTA should be visible — the hero prompt or a move start link.
    const moveLink = page.getByRole("link", { name: /move|sofa|fridge|bed|marketplace/i }).first();
    await expect(moveLink).toBeVisible();

    expect(errors, `JS errors on ${ROUTES.home}: ${errors.join(", ")}`).toHaveLength(0);
  });

  test("/move/new loads without auth redirect", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(ROUTES.moveNew);

    // Must not redirect to login — move/new is a public wizard entry point.
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Expect the page to have a meaningful heading or form element.
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 5_000 });

    expect(errors, `JS errors on ${ROUTES.moveNew}: ${errors.join(", ")}`).toHaveLength(0);
  });

  test("/api/health returns 200 with ok status", async ({ request }) => {
    const response = await request.get(ROUTES.health);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.overall).toBe("ok");
    expect(body.supabase).toBe("ok");
    expect(body.stripe).toBe("ok");
    // Redis is optional locally; accept not_configured or ok.
    expect(["ok", "not_configured"]).toContain(body.redis);
  });

  test("/login page loads", async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /password/i })).toBeVisible();
  });

  test("/signup page loads", async ({ page }) => {
    await page.goto(ROUTES.signup);
    // Must have at minimum an email field.
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("/carrier landing renders", async ({ page }) => {
    await page.goto("/carrier");
    await expect(page).not.toHaveURL(/error/);
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 5_000 });
  });
});
