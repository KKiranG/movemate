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
  const clarificationRequests = requestCards.filter(
    (request) => request.status === "clarification_requested",
  );
  const liveFastMatchRequests = requestCards.filter(
    (request) => request.status === "pending" && Boolean(request.requestGroupId),
  );
  const liveSingleRequests = requestCards.filter(
    (request) => request.status === "pending" && !request.requestGroupId,
  );
  const resolvedRequests = requestCards.filter((request) =>
    ["declined", "expired", "revoked", "cancelled"].includes(request.status),
  );
  const activeRequests = [
    ...clarificationRequests,
    ...liveFastMatchRequests,
    ...liveSingleRequests,
  ];

  return (
    <div className="grid gap-4">
      {clarificationRequests.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="eyebrow">Reply needed</p>
            <h2 className="mt-1 text-lg text-[var(--text-primary)]">Clarifications waiting on you</h2>
          </div>
          {clarificationRequests.map((request) => (
            <Link key={request.id} href={`/bookings/${request.id}`}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg text-[var(--text-primary)]">{request.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      {request.typeLabel}
                    </p>
                    <p className="mt-2 caption">
                      {request.pickupSuburb} to {request.dropoffSuburb}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Clarification reply due by{" "}
                      {formatDateTime(
                        request.clarificationExpiresAt ?? request.responseDeadlineAt,
                      )}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--accent)]">Reply to clarification</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize text-[var(--accent)]">
                      {request.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 font-medium text-[var(--text-primary)]">
                      {formatCurrency(request.requestedTotalPriceCents)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}

      {liveFastMatchRequests.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="eyebrow">Fast Match live</p>
            <h2 className="mt-1 text-lg text-[var(--text-primary)]">Shared requests still looking for the first accept</h2>
          </div>
          {liveFastMatchRequests.map((request) => (
            <Link key={request.id} href={`/bookings/${request.id}`}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg text-[var(--text-primary)]">{request.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Fast Match
                    </p>
                    <p className="mt-2 caption">
                      {request.pickupSuburb} to {request.dropoffSuburb}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Up to three fitting carriers are inside the same response window until one accepts first.
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                      {request.urgencyLabel ?? "Track Fast Match"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize text-[var(--accent)]">
                      {request.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 font-medium text-[var(--text-primary)]">
                      {formatCurrency(request.requestedTotalPriceCents)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}

      {liveSingleRequests.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="eyebrow">Request to Book</p>
            <h2 className="mt-1 text-lg text-[var(--text-primary)]">Single-carrier requests awaiting decision</h2>
          </div>
          {liveSingleRequests.map((request) => (
            <Link key={request.id} href={`/bookings/${request.id}`}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg text-[var(--text-primary)]">{request.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Request to Book
                    </p>
                    <p className="mt-2 caption">
                      {request.pickupSuburb} to {request.dropoffSuburb}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Carrier decision due by {formatDateTime(request.responseDeadlineAt)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                      {request.urgencyLabel ?? "Track request"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize text-[var(--accent)]">
                      {request.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 font-medium text-[var(--text-primary)]">
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
                    <h2 className="text-lg text-[var(--text-primary)]">{booking.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      {booking.bookingReference}
                    </p>
                    <p className="mt-2 caption">
                      {booking.pickupAddress} to {booking.dropoffAddress}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{paymentSummary.badge}</p>
                    {booking.status === "completed" ? (
                      <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                        Rebook from this completed trip
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize text-[var(--accent)]">
                      {booking.status.replace("_", " ")}
                    </p>
                    <p className="mt-1 font-medium text-[var(--text-primary)]">
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
              <p className="eyebrow">Recent request outcomes</p>
              <h2 className="mt-1 text-lg text-[var(--text-primary)]">Requests that did not become bookings</h2>
            </div>
            <div className="grid gap-3">
              {resolvedRequests.slice(0, 3).map((request) => (
                <Link key={request.id} href={`/bookings/${request.id}`}>
                  <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{request.itemDescription}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {request.pickupSuburb} to {request.dropoffSuburb}
                        </p>
                        {request.preferredDate ? (
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Requested for {formatDate(request.preferredDate)}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          {request.status.replaceAll("_", " ")}
                        </p>
                        {request.status === "expired" && request.typeLabel === "Fast Match" ? (
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Fast Match timed out
                          </p>
                        ) : null}
                      </div>
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
              <p className="eyebrow">No requests or bookings yet</p>
              <h2 className="mt-1 text-lg text-[var(--text-primary)]">Start with a move need</h2>
            </div>
            <p className="caption">
              MoveMate ranks spare-capacity matches after you declare the route, timing, and move type.
            </p>
            <Button asChild className="min-h-[44px] active:opacity-80">
              <Link href="/move/new">Declare a move</Link>
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
    <main id="main-content" className="screen">
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
