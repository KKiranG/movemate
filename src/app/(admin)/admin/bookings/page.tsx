import type { Metadata } from "next";
import Link from "next/link";

import { AdminBookingSupportPanel } from "@/components/admin/admin-booking-support-panel";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { requirePageAdminUser } from "@/lib/auth";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { listAdminBookingsPageData } from "@/lib/data/bookings";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BookingPaymentStatus } from "@/types/booking";

export const metadata: Metadata = {
  title: "Admin bookings",
};

function AdminBookingsLoadFailure() {
  return (
    <Card className="border-warning/30 bg-warning/5 p-4">
      <div className="space-y-2">
        <p className="section-label">Retry needed</p>
        <h2 className="text-lg text-text">Bookings queue could not load</h2>
        <p className="text-sm text-text-secondary">
          The admin bookings query failed, so the page is showing a safe retry
          state instead of a full crash. Refresh to retry the bookings queue.
        </p>
      </div>
    </Card>
  );
}

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "captured", label: "Captured" },
  { value: "capture_failed", label: "Capture failed" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
  { value: "authorization_cancelled", label: "Auth cancelled" },
] as const satisfies ReadonlyArray<{
  value: BookingPaymentStatus;
  label: string;
}>;

function buildAdminBookingsHref(params: {
  query?: string;
  page?: number;
  paymentStatus?: BookingPaymentStatus;
}) {
  const searchParams = new URLSearchParams();

  if (params.query?.trim()) {
    searchParams.set("q", params.query.trim());
  }

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.paymentStatus) {
    searchParams.set("paymentStatus", params.paymentStatus);
  }

  const query = searchParams.toString();
  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string; paymentStatus?: string };
}) {
  await requirePageAdminUser();
  const query = searchParams?.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const paymentStatus = PAYMENT_STATUS_OPTIONS.some(
    (option) => option.value === searchParams?.paymentStatus,
  )
    ? (searchParams?.paymentStatus as BookingPaymentStatus)
    : undefined;
  let bookingsData: Awaited<ReturnType<typeof listAdminBookingsPageData>> | null = null;

  try {
    bookingsData = await listAdminBookingsPageData({
      query,
      page,
      pageSize: ADMIN_PAGE_SIZE,
      paymentStatus,
    });
  } catch (error) {
    console.error("Failed to load admin bookings page data", error);
  }

  if (!bookingsData) {
    return (
      <main id="main-content" className="page-shell">
        <PageIntro
          eyebrow="Admin bookings"
          title="Monitor booking state changes"
          description="Operations can inspect all bookings, spot stuck states, and intervene when required."
        />
        <AdminBookingsLoadFailure />
      </main>
    );
  }

  const { bookings, totalCount, paymentCounts } = bookingsData;
  const hasNext = page * ADMIN_PAGE_SIZE < totalCount;
  const paymentFilterCards = [
    {
      href: buildAdminBookingsHref({ query }),
      label: "All payments",
      count: totalCount,
      active: !paymentStatus,
    },
    ...PAYMENT_STATUS_OPTIONS.map((option) => ({
      href: buildAdminBookingsHref({ query, paymentStatus: option.value }),
      label: option.label,
      count: paymentCounts[option.value],
      active: paymentStatus === option.value,
    })),
  ];

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin bookings"
        title="Monitor booking state changes"
        description="Operations can inspect all bookings, spot stuck states, and intervene when required."
      />

      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {paymentFilterCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-2xl border p-4 transition-colors active:bg-black/[0.04] dark:active:bg-white/[0.08] ${
                card.active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-text"
              }`}
            >
              <p className="section-label">{card.label}</p>
              <p className="mt-2 text-3xl">{card.count}</p>
            </Link>
          ))}
        </div>

        <form className="grid gap-2 sm:max-w-md" method="get">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Find by booking reference</span>
            <Input name="q" defaultValue={query} placeholder="MVR-2026-0421" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Payment state</span>
            <select
              name="paymentStatus"
              defaultValue={paymentStatus ?? ""}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              <option value="">All payment states</option>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="page" value="1" />
          <Button type="submit" className="sm:w-fit">
            Search bookings
          </Button>
        </form>
        <AdminBookingSupportPanel bookings={bookings} query={query} />
        {bookings.map((booking) => (
          <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="block active:opacity-95">
          <Card className="p-4">
            {(() => {
              const paymentSummary = getBookingPaymentStateSummary(booking);

              return (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg text-text">{booking.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">
                      {booking.bookingReference}
                    </p>
                    <p className="mt-2 subtle-text">{booking.pickupAddress}</p>
                    <p className="mt-2 text-sm text-text-secondary">
                      {paymentSummary.badge} · {paymentSummary.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm capitalize text-accent">
                      {booking.status.replace("_", " ")}
                    </span>
                    {booking.cancellationReasonCode ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-secondary">
                        {booking.cancellationReasonCode.replace(/_/g, " ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </Card>
          </Link>
        ))}
        {bookings.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">
              {query ? `No bookings found for ${query}.` : "No bookings yet."}
            </p>
          </Card>
        ) : null}
        <AdminPagination
          basePath="/admin/bookings"
          page={page}
          hasNext={hasNext}
          query={query}
          params={{ paymentStatus }}
        />
      </div>
    </main>
  );
}
