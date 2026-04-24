import { getAppUrl } from "@/lib/env";

type SummaryRow = {
  label: string;
  value: string;
};

type EmailLayoutParams = {
  eyebrow: string;
  title: string;
  intro: string;
  summaryRows?: SummaryRow[];
  bodyLines?: string[];
  bulletItems?: string[];
  ctaHref?: string;
  ctaLabel?: string;
  closingNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function absoluteUrl(path: string) {
  return new URL(path, getAppUrl()).toString();
}

function renderSummaryRows(rows: SummaryRow[]) {
  if (rows.length === 0) {
    return "";
  }

  return `
    <div style="border:1px solid #e5e5e5;border-radius:16px;padding:16px;margin:20px 0;background:#fafafa">
      ${rows
        .map(
          (row) => `
            <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#4b5563">
              <strong style="color:#111827">${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}
            </p>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBodyLines(lines: string[]) {
  return lines
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151">${escapeHtml(line)}</p>`,
    )
    .join("");
}

function renderBulletItems(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  return `
    <ul style="margin:0;padding-left:20px;color:#374151">
      ${items
        .map(
          (item) =>
            `<li style="margin:0 0 8px;font-size:15px;line-height:1.6">${escapeHtml(item)}</li>`,
        )
        .join("")}
    </ul>
  `;
}

export function buildEmailHtml(params: EmailLayoutParams) {
  return `
    <div style="background:#f4f6fb;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbe4f0">
        <div style="background:#0066ff;padding:20px 24px;color:#ffffff">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85">${escapeHtml(params.eyebrow)}</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2">MoveMate</h1>
        </div>
        <div style="padding:24px">
          <h2 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#111827">${escapeHtml(params.title)}</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">${escapeHtml(params.intro)}</p>
          ${renderSummaryRows(params.summaryRows ?? [])}
          ${renderBodyLines(params.bodyLines ?? [])}
          ${renderBulletItems(params.bulletItems ?? [])}
          ${
            params.ctaHref && params.ctaLabel
              ? `<div style="margin:24px 0 16px">
                   <a href="${escapeHtml(params.ctaHref)}" style="display:inline-block;background:#0066ff;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:14px">
                     ${escapeHtml(params.ctaLabel)}
                   </a>
                 </div>`
              : ""
          }
          ${
            params.closingNote
              ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b7280">${escapeHtml(params.closingNote)}</p>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

export function buildBookingEmail(params: {
  eyebrow: string;
  title: string;
  intro: string;
  bookingReference: string;
  routeLabel: string;
  tripLabel?: string;
  priceLabel?: string;
  ctaPath: string;
  ctaLabel: string;
  bodyLines?: string[];
  bulletItems?: string[];
}) {
  const summaryRows: SummaryRow[] = [
    { label: "Booking reference", value: params.bookingReference },
    { label: "Route", value: params.routeLabel },
  ];

  if (params.tripLabel) {
    summaryRows.push({ label: "Trip", value: params.tripLabel });
  }

  if (params.priceLabel) {
    summaryRows.push({ label: "Price", value: params.priceLabel });
  }

  return buildEmailHtml({
    eyebrow: params.eyebrow,
    title: params.title,
    intro: params.intro,
    summaryRows,
    bodyLines: params.bodyLines,
    bulletItems: params.bulletItems,
    ctaHref: absoluteUrl(params.ctaPath),
    ctaLabel: params.ctaLabel,
    closingNote:
      "Keep payment changes, proof, and disputes inside MoveMate so the trust record stays usable if anything needs review.",
  });
}

export function buildCarrierVerificationEmail(params: {
  approved: boolean;
  businessName: string;
  notes?: string | null;
}) {
  return buildEmailHtml({
    eyebrow: "Carrier verification",
    title: params.approved ? "You can start posting trips" : "Verification needs changes",
    intro: params.approved
      ? `${params.businessName} is now verified on MoveMate. You can finish payout setup and publish live routes.`
      : `${params.businessName} was reviewed, but a few verification details still need attention before the profile can go live.`,
    bodyLines: params.notes?.trim()
      ? [params.notes.trim()]
      : params.approved
        ? ["Next steps: finish payout setup, review your carrier profile, and publish your next real route."]
        : ["Review your carrier onboarding details, document uploads, and expiry dates, then resubmit."],
    ctaHref: absoluteUrl(params.approved ? "/carrier/payouts" : "/carrier/onboarding"),
    ctaLabel: params.approved ? "Open payouts" : "Review onboarding",
  });
}

export function buildReviewRequestEmail(params: {
  bookingReference: string;
  routeLabel: string;
  ctaPath: string;
}) {
  return buildBookingEmail({
    eyebrow: "Review request",
    title: "Close the loop on this booking",
    intro: "The booking is complete. A short review helps future customers judge real MoveMate supply.",
    bookingReference: params.bookingReference,
    routeLabel: params.routeLabel,
    ctaPath: params.ctaPath,
    ctaLabel: "Leave a review",
    bodyLines: [
      "Reviews on MoveMate only come from completed bookings.",
      "Keep your feedback factual so it stays useful for the next customer.",
    ],
  });
}
