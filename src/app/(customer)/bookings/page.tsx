import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { listUserBookings } from "@/lib/data/bookings";
import { listCustomerRequestCards } from "@/lib/data/booking-requests";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your bookings",
};

async function BookingsListSection({ userId }: { userId: string }) {
  const [bookings, requestCards] = await Promise.all([
    listUserBookings(userId),
    listCustomerRequestCards(userId),
  ]);
  const activeRequests = requestCards.filter((request) =>
    ["pending", "clarification_requested"].includes(request.status),
  );
  const resolvedRequests = requestCards.filter((request) =>
    ["declined", "expired", "revoked"].includes(request.status),
  );

  return (
    <div className="grid gap-4">
      {activeRequests.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="section-label">Open requests</p>
            <h2 className="mt-1 text-lg text-text">Still waiting on a carrier decision</h2>
          </div>
          {activeRequests.map((request) => (
            <Link key={request.id} href={`/bookings/${request.id}`}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg text-text">{request.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">
                      {request.typeLabel}
                    </p>
                    <p className="mt-2 subtle-text">
                      {request.pickupSuburb} to {request.dropoffSuburb}
                    </p>
                    <p className="mt-2 text-sm text-text-secondary">
                      {request.status === "clarification_requested"
                        ? `Clarification reply due by ${formatDateTime(
                            request.clarificationExpiresAt ?? request.responseDeadlineAt,
                          )}`
                        : `Carrier decision due by ${formatDateTime(request.responseDeadlineAt)}`}
                    </p>
                    <p className="mt-2 text-sm font-medium text-accent">
                      {request.status === "clarification_requested"
                        ? "Reply to clarification"
                        : "Track request"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize text-accent">
                      {request.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 font-medium text-text">
                      {formatCurrency(request.requestedTotalPriceCents)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}

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
      {resolvedRequests.length > 0 ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Recent request outcomes</p>
              <h2 className="mt-1 text-lg text-text">Requests that did not become bookings</h2>
            </div>
            <div className="grid gap-3">
              {resolvedRequests.slice(0, 3).map((request) => (
                <Link key={request.id} href={`/bookings/${request.id}`}>
                  <div className="rounded-xl border border-border px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">{request.itemDescription}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {request.pickupSuburb} to {request.dropoffSuburb}
                        </p>
                        {request.preferredDate ? (
                          <p className="mt-1 text-xs text-text-secondary">
                            Requested for {formatDate(request.preferredDate)}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                        {request.status.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {bookings.length === 0 && activeRequests.length === 0 ? (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">No requests or bookings yet</p>
              <h2 className="mt-1 text-lg text-text">Start with a move need</h2>
            </div>
            <p className="subtle-text">
              moverrr ranks spare-capacity matches after you declare the route, timing, and move type.
            </p>
            <Button asChild className="min-h-[44px] active:opacity-80">
              <Link href="/search">Find a match</Link>
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
        title="Track requests and bookings"
        description="See the pre-acceptance request flow first, then the live booking timeline once a carrier accepts."
      />

      <ErrorBoundary>
        <Suspense fallback={<Card className="p-4">Loading bookings...</Card>}>
          <BookingsListSection userId={user.id} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
