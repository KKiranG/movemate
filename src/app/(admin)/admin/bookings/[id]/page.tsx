import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminBookingActions } from "@/components/admin/admin-booking-actions";
import { AdminBookingSupportPanel } from "@/components/admin/admin-booking-support-panel";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { requirePageAdminUser } from "@/lib/auth";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { getAdminBookingById } from "@/lib/data/bookings";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const booking = await getAdminBookingById(params.id);

  if (!booking) {
    return { title: "Admin booking not found" };
  }

  return {
    title: `${booking.bookingReference} | Admin bookings`,
  };
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requirePageAdminUser();
  const booking = await getAdminBookingById(params.id);

  if (!booking) {
    notFound();
  }

  const paymentSummary = getBookingPaymentStateSummary(booking);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin booking"
        title={booking.bookingReference}
        description="One booking, its audit trail, and the manual recovery actions ops needs when something gets stuck."
      />

      <AdminBookingSupportPanel bookings={[booking]} query={booking.bookingReference} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Current state</p>
              <h2 className="mt-1 text-lg text-text">{booking.itemDescription}</h2>
              <p className="mt-2 text-sm text-text-secondary">
                {booking.pickupAddress} to {booking.dropoffAddress}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Booking status</p>
                <p className="mt-2 text-sm font-medium capitalize text-text">
                  {booking.status.replaceAll("_", " ")}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Payment state</p>
                <p className="mt-2 text-sm font-medium text-text">{paymentSummary.badge}</p>
                <p className="mt-1 text-sm text-text-secondary">{paymentSummary.description}</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Customer total</p>
                <p className="mt-2 text-sm font-medium text-text">
                  {formatCurrency(booking.pricing.totalPriceCents)}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Carrier payout</p>
                <p className="mt-2 text-sm font-medium text-text">
                  {formatCurrency(booking.pricing.carrierPayoutCents)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Audit timeline</p>
              <div className="mt-3 grid gap-3">
                {(booking.events ?? []).map((event) => (
                  <div key={event.id} className="rounded-xl border border-border/80 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">{event.eventType.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-xs text-text-secondary">{event.actorRole}</p>
                      </div>
                      <p className="text-xs text-text-secondary">{formatDateTime(event.createdAt)}</p>
                    </div>
                    {"reason" in event.metadata && typeof event.metadata.reason === "string" ? (
                      <p className="mt-2 text-sm text-text-secondary">{event.metadata.reason}</p>
                    ) : null}
                    {"adminReason" in event.metadata && typeof event.metadata.adminReason === "string" ? (
                      <p className="mt-2 text-sm text-text-secondary">{event.metadata.adminReason}</p>
                    ) : null}
                  </div>
                ))}
                {(booking.events ?? []).length === 0 ? (
                  <p className="text-sm text-text-secondary">No booking events recorded yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <AdminBookingActions booking={booking} />
      </div>
    </main>
  );
}
