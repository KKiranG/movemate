"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Trip } from "@/types/trip";
import { formatCurrency } from "@/lib/utils";

export function CarrierPostSuccessCard({ trip }: { trip: Trip }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsVisible(false), 5_000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="border-success/20 bg-success/5 p-4">
      <div className="space-y-4">
        <div>
          <p className="section-label">Trip posted</p>
          <h2 className="mt-1 text-lg text-text">
            Your spare-capacity route is live
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {trip.route.label} · {trip.tripDate} · {trip.timeWindow} ·{" "}
            {formatCurrency(trip.priceCents)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/carrier/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/carrier/post">Post another trip</Link>
          </Button>
          <Button asChild>
            <Link href={`/trip/${trip.id}`}>View trip</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
          <p className="text-sm font-medium text-text">
            Next actions after publish
          </p>
          <div className="mt-2 grid gap-2 text-sm text-text-secondary">
            <p>
              1. Check payout readiness before the first completed booking
              lands.
            </p>
            <p>
              2. Keep proof capture standards clear: pickup, delivery, and any
              exception notes.
            </p>
            <p>
              3. Reply fast once a booking arrives. Pending requests will not
              wait around.
            </p>
            <p>
              4. Watch remaining capacity as bookings change so the live listing
              stays honest.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="min-h-[44px] text-left text-xs uppercase tracking-[0.16em] text-text-secondary active:text-text"
        >
          Dismiss
        </button>
      </div>
    </Card>
  );
}
