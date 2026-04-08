import assert from "node:assert/strict";
import test, { describe } from "node:test";

import {
  formatCurrency,
  formatDate,
  formatLongDate,
  formatSavings,
  formatNumber,
  formatDateTime,
  formatDateTimeInputValue,
  formatFileSize,
} from "@/lib/utils";

describe("Formatting Utilities", () => {
  test("formatCurrency formats cents into AUD string", () => {
    assert.equal(formatCurrency(1500), "$15");
    assert.equal(formatCurrency(19999), "$200");
    assert.equal(formatCurrency(0), "$0");
    assert.equal(formatCurrency(-500), "-$5");
  });

  test("formatDate formats ISO string to short date", () => {
    // We pass dates assuming local timezone to avoid cross-timezone test failures
    const localDate1 = new Date(2023, 0, 1).toISOString();
    assert.equal(formatDate(localDate1), "Sun, 1 Jan");

    const localDate2 = new Date(2023, 11, 25).toISOString();
    assert.equal(formatDate(localDate2), "Mon, 25 Dec");
  });

  test("formatLongDate formats ISO string to long date", () => {
    // We pass dates assuming local timezone to avoid cross-timezone test failures
    const localDate1 = new Date(2023, 0, 1).toISOString();
    assert.equal(formatLongDate(localDate1), "1 January 2023");

    const localDate2 = new Date(2023, 11, 25).toISOString();
    assert.equal(formatLongDate(localDate2), "25 December 2023");
  });

  test("formatSavings formats a percentage correctly", () => {
    assert.equal(formatSavings(15.5), "16% cheaper");
    assert.equal(formatSavings(20), "20% cheaper");
    assert.equal(formatSavings(0), "0% cheaper");
  });

  test("formatNumber formats numbers with thousands separators", () => {
    assert.equal(formatNumber(1500), "1,500");
    assert.equal(formatNumber(1000000), "1,000,000");
    assert.equal(formatNumber(0), "0");
    assert.equal(formatNumber(42), "42");
  });

  test("formatDateTime formats ISO string to date and time", () => {
    // Pass local dates to avoid timezone differences causing failures
    const localDate1 = new Date(2023, 0, 1, 15, 30);
    const result1 = formatDateTime(localDate1);
    assert.ok(result1.includes("1 Jan 2023"));
    assert.ok(result1.includes("3:30"));

    const localDate2 = new Date(2023, 11, 25, 8, 0);
    const result2 = formatDateTime(localDate2);
    assert.ok(result2.includes("25 Dec 2023"));
    assert.ok(result2.includes("8:00"));
  });

  test("formatDateTimeInputValue parses and formats to local ISO string", () => {
    assert.equal(formatDateTimeInputValue(null), "");
    assert.equal(formatDateTimeInputValue(""), "");
    assert.equal(formatDateTimeInputValue("invalid-date"), "");

    // Given a UTC time, it outputs the local time version for the datetime-local input
    const dateStr = "2023-01-01T15:30:00Z";
    const result = formatDateTimeInputValue(dateStr);
    assert.ok(result.length === 16);
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(result));
  });

  test("formatFileSize formats bytes correctly", () => {
    assert.equal(formatFileSize(0), "0 KB");
    assert.equal(formatFileSize(-100), "0 KB");
    assert.equal(formatFileSize(NaN), "0 KB");
    assert.equal(formatFileSize(500), "1 KB");
    assert.equal(formatFileSize(1024), "1 KB");
    assert.equal(formatFileSize(1024 * 500), "500 KB");
    assert.equal(formatFileSize(1024 * 1024), "1.0 MB");
    assert.equal(formatFileSize(1024 * 1024 * 2.5), "2.5 MB");
  });
});
