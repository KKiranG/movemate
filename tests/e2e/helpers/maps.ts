import { type Page } from "@playwright/test";

// Whether the current E2E run is using mock Maps mode.
export const isMapsReal = process.env.E2E_MOCK_MAPS !== "true" &&
  (!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || !!process.env.GOOGLE_MAPS_API_KEY);

// Address values safe for mock Maps mode — these do not require a live Places API call.
// They are plain text strings that the app accepts when E2E_MOCK_MAPS=true.
export const MOCK_ADDRESSES = {
  pickup: "123 Penrith St, Penrith NSW 2750",
  dropoff: "45 Bondi Rd, Bondi Beach NSW 2026",
  pickupShort: "Penrith NSW",
  dropoffShort: "Bondi Beach NSW",
} as const;

// Fill an address field in mock Maps mode.
// In mock mode the field is a plain text input; in real Maps mode it relies on Places autocomplete.
export async function fillAddressField(page: Page, selector: string, value: string) {
  const field = page.locator(selector);
  await field.fill(value);

  if (isMapsReal) {
    // Wait for and select the first autocomplete suggestion.
    const firstSuggestion = page.locator('[role="option"]').first();
    await firstSuggestion.waitFor({ timeout: 5_000 });
    await firstSuggestion.click();
  }
  // In mock mode no autocomplete interaction is needed.
}

// Skip a test that requires real Maps when running in mock mode.
export function skipIfMockMaps(testInfo: { skip: (condition: boolean, reason: string) => void }) {
  testInfo.skip(!isMapsReal, "Real Maps keys not configured — set E2E_MOCK_MAPS=false and provide NEXT_PUBLIC_GOOGLE_MAPS_KEY");
}
