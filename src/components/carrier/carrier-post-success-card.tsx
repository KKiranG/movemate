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
          <h2 className="mt-1 text-lg text-text">Your spare-capacity route is live</h2>
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
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-left text-xs uppercase tracking-[0.16em] text-text-secondary active:text-text"
        >
          Dismiss
        </button>
      </div>
    </Card>
  );
}
