import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("customer profile page saves through a real API route", () => {
  const page = read("src/app/(customer)/account/profile/page.tsx");
  const form = read("src/app/(customer)/account/profile/profile-form.tsx");
  const route = read("src/app/api/account/profile/route.ts");

  assert.match(page, /<ProfileForm/);
  assert.match(form, /fetch\("\/api\/account\/profile"/);
  assert.match(route, /updateCustomerProfileNameForUser/);
  assert.doesNotMatch(page, /defaultValue="Ava"/);
});

test("zero-match Alert the Network creates recovery demand instead of linking to activity", () => {
  const page = read("src/app/(customer)/move/alert/page.tsx");
  const client = read("src/app/(customer)/move/alert/alert-network-client.tsx");
  const route = read("src/app/api/unmatched-requests/from-move-request/route.ts");

  assert.match(page, /<AlertNetworkClient/);
  assert.match(client, /\/api\/unmatched-requests\/from-move-request/);
  assert.match(client, /\/api\/unmatched-requests/);
  assert.match(route, /ensureRecoveryAlertForMoveRequest/);
  assert.doesNotMatch(page, /href="\/activity"/);
});

test("legacy checkout scaffold routes redirect to the real offer detail flow", () => {
  const scaffoldRoutes = ["item", "access", "price", "pay", "submitted"];

  for (const route of scaffoldRoutes) {
    const page = read(`src/app/(customer)/move/new/book/[offerId]/${route}/page.tsx`);

    assert.match(page, /redirect\(`/);
    assert.match(page, /\/move\/new\/results\/\$\{params\.offerId\}/);
    assert.match(page, /moveRequestId/);
    assert.doesNotMatch(page, /demo-booking/);
    assert.doesNotMatch(page, /James T\./);
    assert.doesNotMatch(page, /standardPriceLines/);
    assert.doesNotMatch(page, /Stripe Payment Element placeholder/);
    assert.doesNotMatch(page, /href=\{`\/move\/new\/book/);
  }
});

test("checkout copy follows authorization, acceptance capture, and payout-hold timing", () => {
  const panel = read("src/components/booking/booking-checkout-panel.tsx");

  assert.match(panel, /authorised before acceptance/);
  assert.match(panel, /captured only when a carrier accepts/);
  assert.match(panel, /held until proof and release checks pass/);
  assert.doesNotMatch(panel, /charged once your move is done/);
});
