import Link from "next/link";
import { notFound } from "next/navigation";

import { DisputeForm } from "@/components/booking/dispute-form";
import { CarrierReviewResponseForm } from "@/components/booking/carrier-review-response-form";
import { ReviewForm } from "@/components/booking/review-form";
import { StatusUpdateActions } from "@/components/booking/status-update-actions";
import { SaveTripTemplateAction } from "@/components/carrier/save-trip-template-action";
import { TripEditForm } from "@/components/carrier/trip-edit-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { listCarrierBookings } from "@/lib/data/bookings";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { getBookingFeedbackForUser } from "@/lib/data/feedback";
import { getTripById } from "@/lib/data/trips";
import { formatCurrency } from "@/lib/utils";

type CarrierBooking = Awaited<ReturnType<typeof listCarrierBookings>>[number];
type BookingFeedback = Awaited<ReturnType<typeof getBookingFeedbackForUser>>;

function buildRepostHref(trip: NonNullable<Awaited<ReturnType<typeof getTripById>>>) {
  const params = new URLSearchParams({
    vehicleId: trip.vehicle.id,
    from: trip.route.originSuburb,
    to: trip.route.destinationSuburb,
    space: trip.spaceSize,
    price: Math.round(trip.priceCents / 100).toString(),
    detour: trip.detourRadiusKm.toString(),
    tripDate: trip.tripDate,
    timeWindow: trip.timeWindow,
    volume: trip.availableVolumeM3.toString(),
    weight: trip.availableWeightKg.toString(),
    accepts: trip.rules.accepts.join(","),
    isReturn: trip.isReturnTrip ? "1" : "0",
    stairsOk: trip.rules.stairsOk ? "1" : "0",
    stairsExtra: (trip.rules.stairsExtraCents / 100).toString(),
    helperAvailable: trip.rules.helperAvailable ? "1" : "0",
    helperExtra: (trip.rules.helperExtraCents / 100).toString(),
  });

  if (trip.rules.specialNotes) {
    params.set("notes", trip.rules.specialNotes);
  }

  if (trip.route.originPostcode) {
    params.set("originPostcode", trip.route.originPostcode);
  }

  if (trip.route.destinationPostcode) {
    params.set("destinationPostcode", trip.route.destinationPostcode);
  }

  if (trip.route.originLatitude !== undefined) {
    params.set("originLat", String(trip.route.originLatitude));
  }

  if (trip.route.originLongitude !== undefined) {
    params.set("originLng", String(trip.route.originLongitude));
  }

  if (trip.route.destinationLatitude !== undefined) {
    params.set("destinationLat", String(trip.route.destinationLatitude));
  }

  if (trip.route.destinationLongitude !== undefined) {
    params.set("destinationLng", String(trip.route.destinationLongitude));
  }

  return `/carrier/post?${params.toString()}`;
}

function getBookingOperationsSummary(booking: CarrierBooking) {
  if (booking.status === "pending") {
    return {
      tone: "border-warning/20 bg-warning/10",
      eyebrow: "Pending decision",
      title: "Confirm or decline before the pending hold expires",
      description:
        "This request is still waiting on the carrier decision. Keep payment, contact, and any price changes on moverrr while it is pending.",
    };
  }

  if (booking.status === "confirmed") {
    return {
      tone: "border-border bg-black/[0.02] dark:bg-white/[0.04]",
      eyebrow: "Next required action",
      title: "Pickup proof is the next trust checkpoint",
      description:
        "Capture pickup proof before moving the booking into transit. Important operational replies should still land within 24 hours.",
    };
  }

  if (booking.status === "picked_up" || booking.status === "in_transit") {
    return {
      tone: "border-border bg-black/[0.02] dark:bg-white/[0.04]",
      eyebrow: "Next required action",
      title: "Delivery proof still sits between this booking and payout release",
      description:
        "Use the delivery proof flow at handoff and capture any access, item-fit, or damage evidence immediately so it can be logged in moverrr.",
    };
  }

  if (booking.status === "delivered") {
    return {
      tone: "border-accent/20 bg-accent/5",
      eyebrow: "Waiting on customer",
      title: "Funds stay held until receipt is confirmed",
      description:
        "The delivery is done, but payout stays on hold until the customer confirms receipt or a dispute is resolved.",
    };
  }

  if (booking.status === "completed") {
    return booking.paymentStatus === "capture_failed"
      ? {
          tone: "border-error/20 bg-error/5",
          eyebrow: "Ops review required",
          title: "Payment capture failed after completion",
          description:
            "The job is complete, but ops still needs to resolve the Stripe capture before payout can move.",
        }
      : {
          tone: "border-success/20 bg-success/5",
          eyebrow: "Booking complete",
          title: "Proof, confirmation, and payout flow are closed",
          description:
            "Keep any follow-up inside moverrr so the trust record stays complete for future jobs.",
        };
  }

  if (booking.status === "disputed") {
    return {
      tone: "border-error/20 bg-error/5",
      eyebrow: "Dispute hold",
      title: "Completion and payout stay blocked during dispute review",
      description:
        "Add calm, factual evidence only. Do not move the conversation or payment resolution off-platform.",
    };
  }

  return {
    tone: "border-border bg-black/[0.02] dark:bg-white/[0.04]",
    eyebrow: "Booking state",
    title: booking.status.replaceAll("_", " "),
    description: "Keep the booking updated in moverrr so ops and proof history stay legible.",
  };
}

function CarrierBookingCard({
  booking,
  feedback,
  isFocused,
}: {
  booking: CarrierBooking;
  feedback: BookingFeedback | undefined;
  isFocused: boolean;
}) {
  const paymentSummary = getBookingPaymentStateSummary(booking);
  const canOpenDispute = ["delivered", "completed", "disputed"].includes(booking.status);
  const operationsSummary = getBookingOperationsSummary(booking);

  return (
    <div
      id={`booking-${booking.id}`}
      className={`rounded-xl border p-3 ${isFocused ? "border-accent bg-accent/5" : "border-border"}`}
    >
      <h2 className="text-base text-text">{booking.itemDescription}</h2>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">
        {booking.bookingReference}
      </p>
      <p className="mt-2 subtle-text">
        {booking.pickupAddress} to {booking.dropoffAddress}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {paymentSummary.badge} · {paymentSummary.description}
      </p>
      <div className={`mt-3 rounded-xl border p-3 ${operationsSummary.tone}`}>
        <p className="section-label">{operationsSummary.eyebrow}</p>
        <p className="mt-1 text-sm font-medium text-text">{operationsSummary.title}</p>
        <p className="mt-2 text-sm text-text-secondary">{operationsSummary.description}</p>
      </div>
      <div className="mt-3 rounded-xl border border-border bg-black/[0.02] p-3">
        <p className="text-sm font-medium text-text">Carrier payout breakdown</p>
        <div className="mt-2 grid gap-1 text-sm text-text-secondary">
          <div className="flex items-center justify-between">
            <span>Base fare</span>
            <span>{formatCurrency(booking.pricing.basePriceCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Add-ons</span>
            <span>{formatCurrency(booking.pricing.stairsFeeCents + booking.pricing.helperFeeCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Commission</span>
            <span>-{formatCurrency(booking.pricing.platformCommissionCents)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 font-medium text-text">
            <span>Carrier payout</span>
            <span>{formatCurrency(booking.pricing.carrierPayoutCents)}</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Day-of-job extras stay inside the listed add-ons or an admin-reviewed exception. Do not
          rewrite price in chat or off-platform.
        </p>
      </div>
      <div className="mt-3">
        <StatusUpdateActions bookingId={booking.id} currentStatus={booking.status} />
      </div>
      {booking.status === "completed" && !feedback?.userReview ? (
        <div className="mt-4 space-y-2">
          <p className="section-label">Review customer</p>
          <ReviewForm bookingId={booking.id} />
        </div>
      ) : null}
      {feedback?.reviews
        .filter((review) => review.reviewerType === "customer")
        .map((review) => (
          <div key={review.id} className="mt-4 space-y-2 rounded-xl border border-border p-3">
            <p className="section-label">Customer review</p>
            <p className="text-sm text-text">
              {review.rating}/5 {review.comment ? `· ${review.comment}` : ""}
            </p>
            {review.carrierResponse ? (
              <p className="text-sm text-text-secondary">
                Carrier response: {review.carrierResponse}
              </p>
            ) : (
              <CarrierReviewResponseForm reviewId={review.id} />
            )}
          </div>
        ))}
      {canOpenDispute ? (
        <div className="mt-4 space-y-2">
          <p className="section-label">Issue or suspicious behaviour</p>
          <p className="text-sm text-text-secondary">
            Use this immediately for no-show, wrong item, damage, unsafe access, or off-platform
            payment requests so ops gets a timestamped record.
          </p>
          <DisputeForm bookingId={booking.id} />
        </div>
      ) : null}
    </div>
  );
}

export default async function CarrierTripDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageSessionUser();
  const [trip, carrier] = await Promise.all([
    getTripById(params.id),
    getCarrierByUserId(user.id),
  ]);

  if (!trip) {
    notFound();
  }

  if (!carrier || trip.carrier.id !== carrier.id) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const focusValue = resolvedSearchParams.focus;
  const focusBookingId = Array.isArray(focusValue) ? focusValue[0] : focusValue;
  const savingsCents = trip.dedicatedEstimateCents - trip.priceCents;
  const repostHref = buildRepostHref(trip);
  const bookings = await listCarrierBookings(user.id, { listingId: trip.id });
  const feedbackEntries = await Promise.all(
    bookings.map(async (booking) => [
      booking.id,
      await getBookingFeedbackForUser(user.id, booking.id),
    ] as const),
  );
  const feedbackByBookingId = new Map<string, BookingFeedback>(feedbackEntries);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Carrier trip detail"
        title={trip.route.label}
        description="Edit live inventory, then manage proof-backed status changes for each booking on the run."
      />

      {savingsCents > 0 ? (
        <Card className="border-success/20 bg-success/5 p-4">
          <p className="section-label">Route value</p>
          <h2 className="mt-1 text-lg text-text">
            Customers usually save {formatCurrency(savingsCents)} compared with a dedicated truck
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            That estimate is based on moverrr&apos;s dedicated-route benchmarks for this space size.
          </p>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SaveTripTemplateAction
            tripId={trip.id}
            defaultName={`${trip.route.originSuburb} → ${trip.route.destinationSuburb}`}
          />
          <Button asChild variant="secondary" className="min-h-[44px] active:opacity-80">
            <Link href={repostHref}>
              {trip.status === "expired" || trip.status === "cancelled"
                ? "Re-post this route"
                : "Post this route again"}
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Current vehicle: {trip.vehicle.type.replaceAll("_", " ")}
          {trip.vehicle.make ? ` · ${trip.vehicle.make}` : ""}
          {trip.vehicle.model ? ` ${trip.vehicle.model}` : ""}
        </p>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Listing controls</p>
            <h2 className="mt-1 text-lg text-text">Adjust date, price, capacity, and publish state</h2>
          </div>
          <TripEditForm trip={trip} />
        </div>
      </Card>

      <Card className="p-4">
        <p className="section-label">Bookings on this trip</p>
        <div className="mt-4 grid gap-3">
          {bookings.map((booking) => (
            <CarrierBookingCard
              key={booking.id}
              booking={booking}
              feedback={feedbackByBookingId.get(booking.id)}
              isFocused={focusBookingId === booking.id}
            />
          ))}
          {bookings.length === 0 ? (
            <p className="subtle-text">No bookings on this trip yet.</p>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
