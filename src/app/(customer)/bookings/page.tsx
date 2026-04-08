import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { listUserBookings } from "@/lib/data/bookings";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your bookings",
};

async function BookingsListSection({ userId }: { userId: string }) {
  const bookings = await listUserBookings(userId);

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <Link key={booking.id} href={`/bookings/${booking.id}`}>
          <Card className="p-4">
            {(() => {
              const paymentSummary = getBookingPaymentStateSummary(booking);

              return (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg text-text">{booking.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">
                      {booking.bookingReference}
                    </p>
                    <p className="mt-2 subtle-text">
                      {booking.pickupAddress} to {booking.dropoffAddress}
                    </p>
                    <p className="mt-2 text-sm text-text-secondary">{paymentSummary.badge}</p>
                    {booking.status === "completed" ? (
                      <p className="mt-2 text-sm font-medium text-accent">
                        Rebook from this completed trip
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize text-accent">
                      {booking.status.replace("_", " ")}
                    </p>
                    <p className="mt-1 font-medium text-text">
                      {formatCurrency(booking.pricing.totalPriceCents)}
                    </p>
                  </div>
                </div>
              );
            })()}
          </Card>
        </Link>
      ))}
      {bookings.length === 0 ? (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">No bookings yet</p>
              <h2 className="mt-1 text-lg text-text">Browse trips to get started</h2>
            </div>
            <p className="subtle-text">
              moverrr lets you book spare capacity on trips that are already heading your way.
            </p>
            <Button asChild className="min-h-[44px] active:opacity-80">
              <Link href="/search">Browse available trips</Link>
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export default async function BookingsPage() {
  const user = await requirePageSessionUser();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Bookings"
        title="Track your bookings"
        description="Statuses move from pending to completed with proof photos and customer confirmation before payout release."
      />

      <ErrorBoundary>
        <Suspense fallback={<Card className="p-4">Loading bookings...</Card>}>
          <BookingsListSection userId={user.id} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
