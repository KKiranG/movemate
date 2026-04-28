import Link from "next/link";

import { BookingRequestTimeline } from "@/components/booking/booking-request-timeline";
import { BookingStatusStepper } from "@/components/booking/booking-status-stepper";
import { ConfirmReceiptButton } from "@/components/booking/confirm-receipt-button";
import { DisputeForm } from "@/components/booking/dispute-form";
import { PaymentRecoveryCard } from "@/components/booking/payment-recovery-card";
import { PendingExpiryCountdown } from "@/components/booking/pending-expiry-countdown";
import { PrivateProofTile } from "@/components/booking/private-proof-tile";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getBookingPaymentStateSummary,
  getBookingPriceSummaryRows,
  getConfirmedBookingChecklist,
} from "@/lib/booking-presenters";
import {
  buildCustomerBookingTimeline,
  getCustomerBookingHeroState,
  getCustomerBookingProofSummary,
  getCustomerBookingTrustNotes,
} from "@/lib/customer-booking-detail-presenters";
import type { CustomerBookingDetailData } from "@/lib/data/customer-booking-detail";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

const heroToneClasses = {
  neutral: "border-border bg-surface",
  success: "border-success/20 bg-success/10",
  warning: "border-warning/20 bg-warning/10",
  error: "border-error/20 bg-error/10",
} as const;

function getCarrierTrustLine(detail: CustomerBookingDetailData) {
  if (!detail.trip) {
    return detail.booking.carrierBusinessName ?? "Matching carrier";
  }

  const { carrier } = detail.trip;
  const trustBits = [
    carrier.businessName,
    carrier.isVerified ? "Verified" : null,
    carrier.ratingCount >= 3 ? `${carrier.averageRating.toFixed(1)} stars` : null,
    carrier.ratingCount > 0 ? `${carrier.ratingCount} rating${carrier.ratingCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return trustBits.join(" · ");
}

export async function CustomerBookingDetailView({
  detail,
}: {
  detail: CustomerBookingDetailData;
}) {
  const { booking, disputes, trip } = detail;
  const hero = getCustomerBookingHeroState(booking, disputes);
  const paymentSummary = getBookingPaymentStateSummary(booking);
  const priceRows = getBookingPriceSummaryRows(booking);
  const proof = getCustomerBookingProofSummary(booking);
  const timeline = buildCustomerBookingTimeline(booking, disputes);
  const trustNotes = getCustomerBookingTrustNotes(booking, disputes);
  const openDisputes = disputes.filter(
    (dispute) => dispute.status === "open" || dispute.status === "investigating",
  );
  const canRaiseDispute = booking.status === "delivered";
  const showConfirmReceipt = hero.primaryAction.kind === "confirm_receipt";
  const showPaymentRecovery = hero.primaryAction.kind === "retry_payment";

  return (
    <main
      id="main-content"
      className="screen safe-bottom-pad space-y-4 pb-[calc(104px+env(safe-area-inset-bottom))]"
    >
      <PageIntro
        eyebrow="Booking detail"
        title={booking.itemDescription}
        description={`${booking.pickupSuburb ?? booking.pickupAddress} to ${booking.dropoffSuburb ?? booking.dropoffAddress}`}
        actions={
          <Button asChild variant="secondary">
            <Link href="/bookings">Back to bookings</Link>
          </Button>
        }
      />

      <Card className={`p-4 ${heroToneClasses[hero.tone]}`}>
        <div className="space-y-3">
          <div>
            <p className="section-label">{hero.eyebrow}</p>
            <h2 className="mt-1 text-lg text-text">{hero.title}</h2>
            <p className="mt-2 text-sm text-text-secondary">{hero.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            <span className="rounded-full border border-border px-3 py-1 capitalize">
              {booking.status.replaceAll("_", " ")}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {paymentSummary.badge}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {booking.bookingReference}
            </span>
          </div>
        </div>
      </Card>

      {/* At a glance — shown above content on mobile only; desktop sees it in the sidebar */}
      <Card className="p-4 lg:hidden">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Total</p>
            <p className="mt-2 text-base font-medium text-text">
              {formatCurrency(booking.pricing.totalPriceCents)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Pickup proof</p>
            <p className="mt-2 text-sm text-text">{proof.pickup ? "Recorded" : "Pending"}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Delivery proof</p>
            <p className="mt-2 text-sm text-text">{proof.delivery ? "Recorded" : "Pending"}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Status and next step</p>
                <h2 className="mt-1 text-lg text-text">{hero.title}</h2>
              </div>
              <BookingStatusStepper status={booking.status} />
              {hero.showPendingExpiry && booking.pendingExpiresAt ? (
                <PendingExpiryCountdown expiresAt={booking.pendingExpiresAt} />
              ) : null}
              {showPaymentRecovery ? (
                <div id="payment-recovery">
                  <PaymentRecoveryCard
                    bookingId={booking.id}
                    title={paymentSummary.title}
                    description={paymentSummary.description}
                  />
                </div>
              ) : null}
              {showConfirmReceipt ? (
                <div
                  id="confirm-receipt"
                  className="rounded-xl border border-success/20 bg-success/10 p-4"
                >
                  <p className="text-sm font-medium text-text">
                    Confirm receipt when the delivered item matches the proof and the handoff is complete.
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    If something is wrong, raise a dispute instead so MoveMate keeps payout held and support can review the proof trail.
                  </p>
                  <div className="mt-4">
                    <ConfirmReceiptButton bookingId={booking.id} />
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Route and booking summary</p>
                <h2 className="mt-1 text-lg text-text">The booking record customers can rely on</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Carrier</p>
                  <p className="mt-2 text-sm font-medium text-text">{getCarrierTrustLine(detail)}</p>
                  {trip ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      {trip.route.label} · {formatDate(trip.tripDate)} · {trip.timeWindow}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Move</p>
                  <p className="mt-2 text-sm text-text">
                    {booking.pickupAddress}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    to {booking.dropoffAddress}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Access</p>
                  <p className="mt-2 text-sm text-text-secondary">
                    Stairs pickup: {booking.stairsLevelPickup} · Stairs drop-off: {booking.stairsLevelDropoff} · Movers: {booking.customerMoverPreference === "two_movers" ? "Two movers" : booking.customerMoverPreference === "customer_help" ? "Customer helps" : "One mover"}
                  </p>
                  {booking.pickupAccessNotes ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Pickup notes: {booking.pickupAccessNotes}
                    </p>
                  ) : null}
                  {booking.dropoffAccessNotes ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Dropoff notes: {booking.dropoffAccessNotes}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Recorded</p>
                  <p className="mt-2 text-sm text-text">
                    Created {booking.createdAt ? formatDateTime(booking.createdAt) : "Not available"}
                  </p>
                  {booking.deliveredAt ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Delivered {formatDateTime(booking.deliveredAt)}
                    </p>
                  ) : null}
                  {booking.completedAt ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Completed {formatDateTime(booking.completedAt)}
                    </p>
                  ) : null}
                </div>
              </div>

              {booking.itemPhotoUrls.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {booking.itemPhotoUrls.map((photoUrl, index) => (
                    <a
                      key={`${photoUrl}:${index}`}
                      href={photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Item photo ${index + 1}`}
                        className="h-44 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Price and payment</p>
                <h2 className="mt-1 text-lg text-text">Keep the math and release path explicit</h2>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-text">{paymentSummary.title}</p>
                <p className="mt-2 text-sm text-text-secondary">{paymentSummary.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {priceRows.map((row) => (
                  <div key={row.label} className="rounded-xl border border-border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">{row.label}</p>
                    <p className="mt-2 text-sm font-medium text-text">
                      {formatCurrency(row.valueCents)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Proof and trust trail</p>
                <h2 className="mt-1 text-lg text-text">Proof stays inside the booking record</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {proof.pickup ? (
                  <PrivateProofTile
                    bucket={PRIVATE_BUCKETS.proofPhotos}
                    path={proof.pickup.photoUrl}
                    title="Pickup proof"
                    subtitle={
                      proof.pickup.itemCount
                        ? `${proof.pickup.itemCount} item${proof.pickup.itemCount === 1 ? "" : "s"} recorded at pickup`
                        : "Pickup handoff record"
                    }
                    metadata={{
                      capturedAt: proof.pickup.capturedAt,
                      latitude: proof.pickup.latitude,
                      longitude: proof.pickup.longitude,
                    }}
                  />
                ) : (
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Pickup proof</p>
                    <p className="mt-2 text-sm text-text-secondary">Not yet recorded — carrier captures on pickup day.</p>
                  </div>
                )}
                {proof.delivery ? (
                  <PrivateProofTile
                    bucket={PRIVATE_BUCKETS.proofPhotos}
                    path={proof.delivery.photoUrl}
                    title="Delivery proof"
                    subtitle={
                      proof.delivery.exceptionCode && proof.delivery.exceptionCode !== "none"
                        ? `Issue noted: ${proof.delivery.exceptionCode.replaceAll("_", " ")}`
                        : "Delivery handoff record"
                    }
                    metadata={{
                      capturedAt: proof.delivery.capturedAt,
                      latitude: proof.delivery.latitude,
                      longitude: proof.delivery.longitude,
                    }}
                  />
                ) : (
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Delivery proof</p>
                    <p className="mt-2 text-sm text-text-secondary">Not yet recorded — required before payout releases.</p>
                  </div>
                )}
              </div>
              {proof.delivery?.exceptionNote ? (
                <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
                  <p className="text-sm font-medium text-text">Delivery issue note</p>
                  <p className="mt-2 text-sm text-text-secondary">{proof.delivery.exceptionNote}</p>
                </div>
              ) : null}
              <div className="grid gap-2">
                {trustNotes.map((note) => (
                  <div key={note} className="rounded-xl border border-border px-3 py-3 text-sm text-text-secondary">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {booking.status === "confirmed" ? (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <p className="section-label">Before pickup</p>
                  <h2 className="mt-1 text-lg text-text">Keep the handoff predictable</h2>
                </div>
                <div className="grid gap-3">
                  {getConfirmedBookingChecklist().map((item) => (
                    <div key={item} className="rounded-xl border border-border px-3 py-3 text-sm text-text-secondary">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}

          {canRaiseDispute || openDisputes.length > 0 ? (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <p className="section-label">Issues and disputes</p>
                  <h2 className="mt-1 text-lg text-text">
                    {openDisputes.length > 0 ? "The issue trail is already open" : "Raise an issue without leaving the trust boundary"}
                  </h2>
                </div>

                {openDisputes.length > 0 ? (
                  <div className="grid gap-3">
                    {openDisputes.map((dispute) => (
                      <div key={dispute.id} className="rounded-xl border border-error/20 bg-error/5 p-3">
                        <p className="text-sm font-medium text-text">
                          {dispute.category.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Opened {formatDateTime(dispute.createdAt)} · {dispute.status}
                        </p>
                        <p className="mt-2 text-sm text-text-secondary">{dispute.description}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {canRaiseDispute ? (
                  <div id="raise-dispute">
                    <DisputeForm bookingId={booking.id} />
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Booking timeline</p>
                <h2 className="mt-1 text-lg text-text">Proof, payment, and issue history in order</h2>
              </div>
              <BookingRequestTimeline entries={timeline} />
            </div>
          </Card>
        </div>

        {/* Desktop sidebar — hidden on mobile (see full-width card above) */}
        <div className="hidden lg:block">
          <Card className="p-4">
            <div className="space-y-3">
              <p className="section-label">At a glance</p>
              <div className="grid gap-3">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Customer total</p>
                  <p className="mt-2 text-lg font-medium text-text">
                    {formatCurrency(booking.pricing.totalPriceCents)}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Route</p>
                  <p className="mt-2 text-sm text-text">
                    {booking.pickupSuburb ?? booking.pickupAddress}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    to {booking.dropoffSuburb ?? booking.dropoffAddress}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Proof status</p>
                  <p className="mt-2 text-sm text-text">
                    Pickup {proof.pickup ? "recorded" : "pending"}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Delivery {proof.delivery ? "recorded" : "pending"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {hero.primaryAction.kind !== "none" ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">{hero.eyebrow}</p>
              <p className="truncate text-sm font-medium text-text">{hero.title}</p>
            </div>
            {hero.primaryAction.anchorId && hero.primaryAction.label ? (
              <Button asChild size="sm">
                <a href={`#${hero.primaryAction.anchorId}`}>{hero.primaryAction.label}</a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
