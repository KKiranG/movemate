import assert from "node:assert/strict";
import test from "node:test";

import { canTransitionBooking } from "@/lib/status-machine";

const validTransitions: Array<[string, string]> = [
  ["pending", "confirmed"],
  ["pending", "cancelled"],
  ["confirmed", "picked_up"],
  ["confirmed", "cancelled"],
  ["picked_up", "in_transit"],
  ["picked_up", "delivered"],
  ["in_transit", "delivered"],
  ["delivered", "completed"],
  ["delivered", "disputed"],
  ["completed", "disputed"],
  ["disputed", "completed"],
  ["disputed", "cancelled"],
];

const invalidTransitions: Array<[string, string]> = [
  ["pending", "picked_up"],
  ["confirmed", "completed"],
  ["picked_up", "confirmed"],
  ["in_transit", "picked_up"],
  ["delivered", "confirmed"],
  ["completed", "pending"],
  ["cancelled", "confirmed"],
  ["cancelled", "disputed"],
];

test("booking state machine allows only documented transitions", () => {
  for (const [currentStatus, nextStatus] of validTransitions) {
    assert.equal(
      canTransitionBooking(
        currentStatus as Parameters<typeof canTransitionBooking>[0],
        nextStatus as Parameters<typeof canTransitionBooking>[1],
      ),
      true,
      `${currentStatus} -> ${nextStatus} should be allowed`,
    );
  }

  for (const [currentStatus, nextStatus] of invalidTransitions) {
    assert.equal(
      canTransitionBooking(
        currentStatus as Parameters<typeof canTransitionBooking>[0],
        nextStatus as Parameters<typeof canTransitionBooking>[1],
      ),
      false,
      `${currentStatus} -> ${nextStatus} should be rejected`,
    );
  }
});

