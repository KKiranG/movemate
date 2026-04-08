import assert from "node:assert/strict";
import test from "node:test";

import { secureCompare } from "@/lib/server/utils";

test("secureCompare returns true for matching strings", () => {
  assert.strictEqual(secureCompare("hello", "hello"), true);
  assert.strictEqual(secureCompare("", ""), true);
  assert.strictEqual(secureCompare("a".repeat(1000), "a".repeat(1000)), true);
});

test("secureCompare returns false for non-matching strings", () => {
  assert.strictEqual(secureCompare("hello", "world"), false);
  assert.strictEqual(secureCompare("hello", "hell"), false);
  assert.strictEqual(secureCompare("hell", "hello"), false);
  assert.strictEqual(secureCompare("123", "1234"), false);
  assert.strictEqual(secureCompare("", "something"), false);
});
