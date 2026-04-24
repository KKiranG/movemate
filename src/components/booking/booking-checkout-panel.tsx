"use client";

import { BookingForm, type RequestMode } from "@/components/booking/booking-form";
import { Card } from "@/components/ui/card";
import type { MoveRequest } from "@/types/move-request";
import type { Trip } from "@/types/trip";
import type { CustomerPaymentProfile } from "@/lib/data/customer-payments";

export function BookingCheckoutPanel({
  trip,
  isAuthenticated,
  existingMoveRequest,
  initialOfferId,
  customerPaymentProfile,
  requestMode = "single",
}: {
  trip: Trip;
  isAuthenticated: boolean;
  existingMoveRequest?: MoveRequest | null;
  initialOfferId?: string | null;
  customerPaymentProfile?: CustomerPaymentProfile | null;
  requestMode?: RequestMode;
}) {
  const modeLabel = requestMode === "single" ? "Request to Book" : "Fast Match";

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="section-label">Checkout</p>
        <h2 className="mt-1 text-lg text-text">Confirm the move and authorise the request</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-medium text-text">Booking mode:</span> {modeLabel}
          </p>
          <p>Address, photo, price, payment method, then authorise.</p>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Payment stays inside MoveMate: the request is authorised before acceptance, captured only when a carrier accepts,
          then held until proof and release checks pass.
        </p>
      </Card>

      <BookingForm
        trip={trip}
        isAuthenticated={isAuthenticated}
        id="booking-form"
        requestMode={requestMode}
        existingMoveRequest={existingMoveRequest}
        initialOfferId={initialOfferId}
        customerPaymentProfile={customerPaymentProfile}
      />
    </div>
  );
}
