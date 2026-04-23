import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { PendingBookingsAlert } from "@/components/carrier/pending-bookings-alert";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import {
  listCarrierRecentRequestOutcomeCards,
  listCarrierRequestCards,
} from "@/lib/data/booking-requests";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carrier requests",
  description: "Review open customer requests that still need a carrier decision.",
};

export default async function CarrierRequestsPage() {
  const user = await requirePageSessionUser();
  const [requests, recentOutcomes] = await Promise.all([
    listCarrierRequestCards(user.id),
    listCarrierRecentRequestOutcomeCards(user.id),
  ]);

  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="Requests"
        title="Review the work that still needs a decision"
        description="Open requests now live in their own queue with payout, fit, access, and clarification context on every decision card."
      />

      {requests.length > 0 ? (
        <PendingBookingsAlert requests={requests} compact />
      ) : (
        <Card className="p-4">
          <p className="eyebrow">Requests</p>
          <h2 className="mt-1 text-lg text-text">No open requests right now</h2>
          <p className="mt-2 text-sm text-text-secondary">
            When customers ask for space on your active trips, those decisions will appear here with payout, fit, and clarification context first.
          </p>
        </Card>
      )}

      {recentOutcomes.length > 0 ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Recent outcomes</p>
              <h2 className="mt-1 text-lg text-text">Requests that already resolved</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Fast Match revokes, declines, and accepts stay visible here so the request queue keeps a clean operational trail.
              </p>
            </div>
            <div className="grid gap-3">
              {recentOutcomes.map((request) => (
                <div key={request.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text">{request.itemDescription}</p>
                      <p className="mt-1 text-sm text-text-secondary">{request.routeLabel}</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {request.typeLabel} · {formatCurrency(request.requestedTotalPriceCents)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                        {request.status.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {formatDateTime(request.respondedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}
    </main>
  );
}
