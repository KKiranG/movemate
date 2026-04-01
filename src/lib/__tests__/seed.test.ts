import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const seedSql = fs.readFileSync(
  path.join(process.cwd(), "supabase/seed.sql"),
  "utf8",
);

test("seed listings use relative dates", () => {
  assert.match(seedSql, /current_date\s*\+\s*(?:interval\s+'2 days'|2)/i);
});

test("seed file has no hardcoded calendar dates", () => {
  const hardcodedDates = seedSql.match(/\b20\d{2}-\d{2}-\d{2}\b/g) ?? [];
  assert.deepEqual(hardcodedDates, []);
});

