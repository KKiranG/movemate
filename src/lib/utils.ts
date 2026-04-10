import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatSavings(savingsPct: number) {
  return `${Math.round(savingsPct)}% cheaper`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-AU").format(value);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTimeInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const localDate = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isHeicLikePath(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /\.(heic|heif)$/i.test(value);
}

export function isPreviewableImagePath(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /\.(png|jpe?g|webp|gif|svg)$/i.test(value);
}

export function getDateOffsetIso(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().split("T")[0] ?? date;
}

export function getDateDistanceInDays(a: string, b: string) {
  const first = new Date(`${a}T00:00:00`).getTime();
  const second = new Date(`${b}T00:00:00`).getTime();

  if (Number.isNaN(first) || Number.isNaN(second)) {
    return 0;
  }

  return Math.round((second - first) / (24 * 60 * 60 * 1000));
}

export function getNextWeekdayDate(weekday: number, from = new Date()) {
  const date = new Date(from);
  const delta = (weekday - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + delta);
  return date.toISOString().split("T")[0] ?? "";
}

export function appendSentence(base: string, next: string) {
  const trimmedBase = sanitizeText(base);
  const trimmedNext = sanitizeText(next);

  if (!trimmedNext) {
    return trimmedBase;
  }

  if (!trimmedBase) {
    return trimmedNext;
  }

  return `${trimmedBase.replace(/[.!\s]+$/, "")} ${trimmedNext}`;
}

export function slugToLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getTodayIsoDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().split("T")[0] ?? "";
}

export function sanitizeText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSafeRedirectUrl(
  url: string | null | undefined,
  fallback: string = "/",
): string {
  if (!url) return fallback;
  // Ensure the URL is an internal path and not a protocol-relative URL (e.g. //example.com)
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return fallback;
}
