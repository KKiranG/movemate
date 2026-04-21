# Example: Pricing Identity Check

## Scenario

A developer changes rounding logic in `src/lib/pricing/breakdown.ts`. This example shows how to confirm the commission identity held before and after.

## Run

```bash
npm run test -- --testPathPattern=breakdown
```

## Expected Output (Passing)

```
PASS src/lib/__tests__/breakdown.test.ts
  ✓ commission applies only to basePriceCents (2ms)
  ✓ stairs fee is not commissionable (1ms)
  ✓ helper fee is not commissionable (1ms)
  ✓ booking fee remains zero (1ms)
  ✓ total = payout + commission + gst (1ms)
```

## Adversarial Case

Deliberately set `commissionCents = Math.round(totalPriceCents * 0.15)` (wrong — commission on total, not base) and confirm the test fails:

```
FAIL src/lib/__tests__/breakdown.test.ts
  ✗ commission applies only to basePriceCents
    Expected: 1500  (15% of base $100)
    Received: 2025  (15% of total $135 including stairs + helper fees)
```

## Identity That Must Always Hold

```text
Customer pays:   base + stairs_fee + helper_fee + commission + gst
Carrier earns:   base + stairs_fee + helper_fee
Platform earns:  (base * 15%)
```

Commission never touches stairs or helper fees. If it does, the tests will catch it.

## Files

- `src/lib/pricing/breakdown.ts` — formula
- `src/lib/__tests__/breakdown.test.ts` — identity tests
