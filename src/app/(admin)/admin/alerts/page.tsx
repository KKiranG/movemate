import type { Metadata } from "next";

import { ConciergeOfferActions } from "@/components/admin/concierge-offer-actions";
import { ConciergeOfferForm } from "@/components/admin/concierge-offer-form";
import { OperatorTaskActions } from "@/components/admin/operator-task-actions";
import { TripFreshnessActions } from "@/components/admin/trip-freshness-actions";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { requirePageAdminUser } from "@/lib/auth";
import { listConditionAdjustmentsForAdmin } from "@/lib/data/condition-adjustments";
import { listAdminAlertQueueData } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";
import { getConditionAdjustmentReasonLabel } from "@/lib/validation/condition-adjustment";

export const metadata: Metadata = {
  title: "Admin alerts",
};

export default async function AdminAlertsPage() {
  await requirePageAdminUser();
  const [data, conditionAdjustments] = await Promise.all([
    listAdminAlertQueueData(),
    listConditionAdjustmentsForAdmin({ status: "pending", limit: 10 }),
  ]);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin alerts"
        title="Unmatched demand and sparse-supply follow-up"
        description="Use this queue to keep route demand alive, escalate stale alerts, and create founder-sourced concierge offers without leaving the product."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="section-label">Open operator tasks</p>
          <p className="mt-2 text-3xl text-text">{data.operatorTasks.length}</p>
          <p className="mt-2 text-sm text-text-secondary">Founder follow-up work that still needs action.</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Matched alert logs</p>
          <p className="mt-2 text-3xl text-text">{data.notificationLogs.length}</p>
          <p className="mt-2 text-sm text-text-secondary">Recent matched-alert sends with dedupe and delivery status.</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Freshness follow-up</p>
          <p className="mt-2 text-3xl text-text">{data.staleTrips.length}</p>
          <p className="mt-2 text-sm text-text-secondary">Trips close to go-time that still need manual freshness review.</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Open adjustments</p>
          <p className="mt-2 text-3xl text-text">{conditionAdjustments.length}</p>
          <p className="mt-2 text-sm text-text-secondary">Structured misdescription paths waiting on customer response.</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-4">
          {data.sections.map((section) => (
            <Card key={section.key} className="p-4">
              <div>
                <p className="section-label">{section.title}</p>
                <h2 className="mt-1 text-lg text-text">{section.items.length} items</h2>
              </div>
              <div className="mt-4 grid gap-4">
                {section.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">{item.routeLabel}</p>
                        <p className="mt-1 text-sm text-text-secondary">{item.itemLabel}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          Created {new Date(item.createdAt).toLocaleString("en-AU")}
                          {item.notifyEmail ? ` · ${item.notifyEmail}` : ""}
                        </p>
                      </div>
                      {item.matchedAt ? (
                        <p className="text-xs text-success">
                          Matched {new Date(item.matchedAt).toLocaleString("en-AU")}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
                        <p className="text-sm font-medium text-text">Suggested carriers on this corridor</p>
                        <div className="mt-2 grid gap-2">
                          {item.carrierSuggestions.length > 0 ? (
                            item.carrierSuggestions.map((suggestion) => (
                              <div key={`${item.id}:${suggestion.carrierId}`} className="rounded-xl border border-border bg-background px-3 py-2">
                                <p className="text-sm font-medium text-text">{suggestion.businessName}</p>
                                <p className="mt-1 text-sm text-text-secondary">
                                  {suggestion.tripDate} · {suggestion.timeWindow} · from {formatCurrency(suggestion.basePriceCents)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-text-secondary">
                              No direct corridor suggestions are live right now.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <ConciergeOfferForm
                          unmatchedRequestId={item.id}
                          carrierOptions={item.carrierSuggestions}
                        />
                        <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
                          <p className="text-sm font-medium text-text">Concierge offers on record</p>
                          <div className="mt-2 grid gap-2">
                            {item.conciergeOffers.length > 0 ? (
                              item.conciergeOffers.map((offer) => (
                                <div key={offer.id} className="rounded-xl border border-border bg-background px-3 py-2">
                                  <p className="text-sm font-medium text-text">
                                    {formatCurrency(offer.quotedTotalPriceCents)} · {offer.status}
                                  </p>
                                  <p className="mt-1 text-sm text-text-secondary">
                                    {offer.note ?? "No note recorded."}
                                  </p>
                                  <p className="mt-1 text-xs text-text-secondary">
                                    {offer.sentAt
                                      ? `Sent ${new Date(offer.sentAt).toLocaleString("en-AU")}`
                                      : "Not sent yet"}
                                    {offer.respondedAt
                                      ? ` · responded ${new Date(offer.respondedAt).toLocaleString("en-AU")}`
                                      : ""}
                                  </p>
                                  <ConciergeOfferActions
                                    conciergeOfferId={offer.id}
                                    status={offer.status}
                                  />
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-text-secondary">
                                No concierge offers recorded for this demand yet.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {section.items.length === 0 ? (
                  <p className="text-sm text-text-secondary">No items in this state right now.</p>
                ) : null}
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4">
          <Card className="p-4">
            <p className="section-label">Operator queue</p>
            <h2 className="mt-1 text-lg text-text">What needs founder action first</h2>
            <div className="mt-4 grid gap-3">
              {data.operatorTasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-text">{task.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{task.blocker ?? "No blocker recorded."}</p>
                  <p className="mt-2 text-xs text-text-secondary">
                    {task.priority} priority · {task.status}
                    {task.dueAt ? ` · due ${new Date(task.dueAt).toLocaleString("en-AU")}` : ""}
                  </p>
                  <div className="mt-3">
                    <OperatorTaskActions taskId={task.id} initialStatus={task.status} />
                  </div>
                </div>
              ))}
              {data.operatorTasks.length === 0 ? (
                <p className="text-sm text-text-secondary">No open operator tasks right now.</p>
              ) : null}
            </div>
          </Card>

          <Card className="p-4">
            <p className="section-label">Condition adjustments</p>
            <h2 className="mt-1 text-lg text-text">Structured exception paths in flight</h2>
            <div className="mt-4 grid gap-3">
              {conditionAdjustments.map((adjustment) => (
                <div key={adjustment.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-text">
                    {getConditionAdjustmentReasonLabel(adjustment.reasonCode)}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {formatCurrency(adjustment.amountCents)} · {adjustment.status}
                  </p>
                  <p className="mt-2 text-xs text-text-secondary">
                    Booking {adjustment.bookingId.slice(0, 8).toUpperCase()} · due{" "}
                    {new Date(adjustment.responseDeadlineAt).toLocaleString("en-AU")}
                  </p>
                </div>
              ))}
              {conditionAdjustments.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No structured condition adjustments are waiting right now.
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="p-4">
            <p className="section-label">Freshness review</p>
            <h2 className="mt-1 text-lg text-text">Trips close to go-time</h2>
            <div className="mt-4 grid gap-3">
              {data.staleTrips.map((trip) => (
                <div key={trip.listingId} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text">{trip.routeLabel}</p>
                      <p className="mt-1 text-sm text-text-secondary">{trip.blocker}</p>
                    </div>
                    <p
                      className={`text-xs uppercase tracking-[0.16em] ${
                        trip.status === "suspended" ? "text-error" : "text-warning"
                      }`}
                    >
                      {trip.status}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-text-secondary">
                    <p>Trip date {trip.tripDate}</p>
                    <p>
                      Impacted live bookings {trip.bookingCount} · freshness misses {trip.freshnessMissCount}
                    </p>
                    {trip.suspensionReason ? (
                      <p>Reason {trip.suspensionReason.replaceAll("_", " ")}</p>
                    ) : null}
                    {trip.lastActionAt ? (
                      <p>
                        Last ops action {trip.lastActionLabel?.replaceAll("_", " ") ?? "recorded"} on{" "}
                        {new Date(trip.lastActionAt).toLocaleString("en-AU")}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <TripFreshnessActions tripId={trip.listingId} canUnsuspend={trip.status === "suspended"} />
                  </div>
                </div>
              ))}
              {data.staleTrips.length === 0 ? (
                <p className="text-sm text-text-secondary">No freshness follow-up items right now.</p>
              ) : null}
            </div>
          </Card>

          <Card className="p-4">
            <p className="section-label">Matched-alert delivery log</p>
            <h2 className="mt-1 text-lg text-text">Recent sends and failures</h2>
            <div className="mt-4 grid gap-3">
              {data.notificationLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-text">{log.status}</p>
                  <p className="mt-1 text-sm text-text-secondary">{log.dedupeKey}</p>
                  {log.failureReason ? (
                    <p className="mt-1 text-sm text-error">{log.failureReason}</p>
                  ) : null}
                </div>
              ))}
              {data.notificationLogs.length === 0 ? (
                <p className="text-sm text-text-secondary">No matched-alert notifications logged yet.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
