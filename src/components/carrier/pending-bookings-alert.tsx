"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { Booking } from "@/types/booking";
import { formatDateTime } from "@/lib/utils";

function formatRemainingTime(value: string | null | undefined, now: number) {
  if (!value) {
    return "No expiry time set";
  }

  const expiry = new Date(value).getTime();
  if (Number.isNaN(expiry)) {
    return "No expiry time set";
  }

  const diff = expiry - now;
  if (diff <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

export function PendingBookingsAlert({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
    [bookings],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  async function updateBooking(booking: Booking, nextStatus: "confirmed" | "cancelled") {
    setBusyId(`${booking.id}:${nextStatus}`);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStatus,
          cancellationReason:
            nextStatus === "cancelled"
              ? "Declined from carrier dashboard before confirmation."
              : undefined,
          cancellationReasonCode:
            nextStatus === "cancelled" ? "carrier_unavailable" : undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update booking.");
      }

      router.refresh();
    } catch (error) {
      // Keep this lightweight: the dashboard refresh will re-sync after retry.
      console.error(error);
    } finally {
      setBusyId(null);
    }
  }

  if (pendingBookings.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning/20 bg-warning/10 p-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Pending bookings</p>
            <h2 className="mt-1 text-lg text-text">Respond before the 2-hour window closes</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {pendingBookings.length} booking{pendingBookings.length === 1 ? "" : "s"} need a decision now.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            Highest trust signal on the supply side
          </p>
        </div>

        <div className="grid gap-3">
          {pendingBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-warning/20 bg-background p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={booking.status} />
                    <p className="text-sm font-medium text-text">{booking.bookingReference}</p>
                  </div>
                  <p className="text-sm text-text">{booking.itemDescription}</p>
                  <p className="text-sm text-text-secondary">
                    {booking.pickupAddress} to {booking.dropoffAddress}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Expires {formatRemainingTime(booking.pendingExpiresAt, now)} · Created{" "}
                    {formatDateTime(booking.createdAt ?? new Date().toISOString())}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:min-w-[180px]">
                  <Button
                    type="button"
                    className="min-h-[44px]"
                    disabled={busyId === `${booking.id}:confirmed`}
                    onClick={() => void updateBooking(booking, "confirmed")}
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-[44px]"
                    disabled={busyId === `${booking.id}:cancelled`}
                    onClick={() => void updateBooking(booking, "cancelled")}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
