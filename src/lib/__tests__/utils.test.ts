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
  getDateDistanceInDays,
  getDateOffsetIso,
  getNextWeekdayDate,
  getSafeRedirectUrl,
  getTodayIsoDate,
} from "@/lib/utils";

describe("Formatting Utilities", () => {
  test("formatCurrency formats cents into AUD string", () => {
    assert.equal(formatCurrency(1500), "$15");
    assert.equal(formatCurrency(19999), "$200");
    assert.equal(formatCurrency(0), "$0");
    assert.equal(formatCurrency(-500), "-$5");
  });

  test("formatDate formats ISO string to short date", () => {
    const localDate1 = new Date(2023, 0, 1).toISOString();
    assert.equal(formatDate(localDate1), "Sun, 1 Jan");

    const localDate2 = new Date(2023, 11, 25).toISOString();
    assert.equal(formatDate(localDate2), "Mon, 25 Dec");
  });

  test("formatLongDate formats ISO string to long date", () => {
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

describe("Date Utilities", () => {
  test("getDateOffsetIso adds and subtracts days correctly", () => {
    assert.equal(getDateOffsetIso("2023-01-01", 5), "2023-01-06");
    assert.equal(getDateOffsetIso("2023-01-06", -5), "2023-01-01");
  });

  test("getDateOffsetIso handles boundaries and leap years", () => {
    assert.equal(getDateOffsetIso("2023-01-31", 1), "2023-02-01");
    assert.equal(getDateOffsetIso("2023-12-31", 1), "2024-01-01");
    assert.equal(getDateOffsetIso("2024-02-28", 1), "2024-02-29");
    assert.equal(getDateOffsetIso("2024-02-29", 1), "2024-03-01");
    assert.equal(getDateOffsetIso("2023-02-28", 1), "2023-03-01");
  });

  test("getDateOffsetIso returns original date on invalid input", () => {
    assert.equal(getDateOffsetIso("invalid", 5), "invalid");
  });

  test("getDateDistanceInDays calculates distance correctly", () => {
    assert.equal(getDateDistanceInDays("2023-01-01", "2023-01-01"), 0);
    assert.equal(getDateDistanceInDays("2023-01-01", "2023-01-02"), 1);
    assert.equal(getDateDistanceInDays("2023-01-02", "2023-01-01"), -1);
    assert.equal(getDateDistanceInDays("2024-02-28", "2024-03-01"), 2);
  });

  test("getDateDistanceInDays returns 0 on invalid input", () => {
    assert.equal(getDateDistanceInDays("invalid", "2023-01-01"), 0);
    assert.equal(getDateDistanceInDays("2023-01-01", "invalid"), 0);
  });

  test("getNextWeekdayDate calculates the next weekday correctly", () => {
    const sunday = new Date("2023-01-01T12:00:00Z");
    assert.equal(getNextWeekdayDate(1, sunday), "2023-01-02");
    assert.equal(getNextWeekdayDate(6, sunday), "2023-01-07");

    const monday = new Date("2023-01-02T12:00:00Z");
    assert.equal(getNextWeekdayDate(1, monday), "2023-01-09");
  });

  test("getTodayIsoDate returns a valid local YYYY-MM-DD string", () => {
    const today = getTodayIsoDate();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);

    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    const expected = localDate.toISOString().split("T")[0];
    assert.equal(today, expected);
  });
});

describe("Redirect Safety", () => {
  test("getSafeRedirectUrl returns safe in-app paths", () => {
    assert.equal(getSafeRedirectUrl("/dashboard"), "/dashboard");
    assert.equal(getSafeRedirectUrl("/user/123"), "/user/123");
  });

  test("getSafeRedirectUrl falls back for dangerous URLs", () => {
    assert.equal(getSafeRedirectUrl("https://evil.com"), "/search");
    assert.equal(getSafeRedirectUrl("//evil.com"), "/search");
    assert.equal(getSafeRedirectUrl("/\\evil.com"), "/search");
    assert.equal(getSafeRedirectUrl("javascript:alert(1)"), "/search");
  });

  test("getSafeRedirectUrl falls back for missing or invalid input", () => {
    assert.equal(getSafeRedirectUrl(null), "/search");
    assert.equal(getSafeRedirectUrl(undefined), "/search");
    assert.equal(getSafeRedirectUrl(""), "/search");
    assert.equal(getSafeRedirectUrl(null, "/custom"), "/custom");
  });
});
