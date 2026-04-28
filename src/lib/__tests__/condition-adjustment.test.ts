import assert from "node:assert/strict";
import test from "node:test";

import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import {
  conditionAdjustmentCreateSchema,
  conditionAdjustmentResponseSchema,
} from "@/lib/validation/condition-adjustment";

test("condition adjustment amounts stay on the platform-defined ladder", () => {
  const valid = conditionAdjustmentCreateSchema.safeParse({
    reasonCode: "stairs_mismatch",
    amountCents: 3000,
    note: "Two additional flights of stairs were not declared.",
  });
  const invalid = conditionAdjustmentCreateSchema.safeParse({
    reasonCode: "stairs_mismatch",
    amountCents: 3200,
  });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test("condition adjustment responses stay bounded to accept or reject", () => {
  const accept = conditionAdjustmentResponseSchema.safeParse({ action: "accept" });
  const reject = conditionAdjustmentResponseSchema.safeParse({
    action: "reject",
    customerResponseNote: "The booking details were accurate, so I am rejecting this change.",
  });
  const invalid = conditionAdjustmentResponseSchema.safeParse({
    action: "counter",
  });

  assert.equal(accept.success, true);
  assert.equal(reject.success, true);
  assert.equal(invalid.success, false);
});

test("accepted condition adjustments increase payout and GST but not base commission", () => {
  const breakdown = calculateBookingBreakdown({
    basePriceCents: 12_000,
    needsStairs: false,
    stairsExtraCents: 0,
    needsHelper: true,
    helperExtraCents: 1_500,
    secondMoverFeeCents: 2_000,
    adjustmentFeeCents: 3_000,
  });

  assert.equal(breakdown.adjustmentFeeCents, 3_000);
  assert.equal(breakdown.secondMoverFeeCents, 2_000);
  assert.equal(breakdown.platformFeeCents, 1_800);
  assert.equal(breakdown.platformCommissionCents, 1_800);
  assert.equal(breakdown.carrierPayoutCents, 18_500);
  assert.equal(breakdown.gstCents, 2_030);
  assert.equal(breakdown.totalPriceCents, 22_330);
});
