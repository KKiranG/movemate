import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test, { describe } from "node:test";

describe("Copy drift", () => {
  test("scan-product-drift script reports no forbidden marketplace language", () => {
    const result = spawnSync("node", ["scripts/scan-product-drift.mjs"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.status !== 0) {
      const detail = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
      assert.fail(`Product drift scan failed:\n${detail}`);
    }
  });
});
