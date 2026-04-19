"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getRouteAlertPrimaryAction } from "@/lib/alert-presenters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RouteAlert } from "@/types/customer";
import type { CustomerConciergeOffer, UnmatchedRequest } from "@/types/alert";
import { formatDateTime } from "@/lib/utils";

function AlertCard({ alert }: { alert: RouteAlert }) {
  const router = useRouter();
  const [notifyEmail, setNotifyEmail] = useState(alert.notifyEmail);
  const [dateFrom, setDateFrom] = useState(alert.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(alert.dateTo ?? "");
  const [isActive, setIsActive] = useState(alert.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchHref = `/search?${new URLSearchParams({
    from: alert.fromSuburb,
    to: alert.toSuburb,
    ...(alert.dateFrom ? { when: alert.dateFrom } : {}),
    ...(alert.itemCategory ? { what: alert.itemCategory } : {}),
  }).toString()}`;

  async function saveChanges(nextIsActive = isActive) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          isActive: nextIsActive,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update this alert.");
      }

      setIsActive(payload.alert.isActive);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update this alert.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAlert() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete this alert.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete this alert.",
      );
      setIsSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Alert</p>
            <h2 className="mt-1 text-heading text-text">
              {alert.fromSuburb} to {alert.toSuburb}
            </h2>
            <p className="mt-1 text-body text-text-secondary">
              {alert.itemCategory
                ? `Watching for ${alert.itemCategory} capacity`
                : "Watching any move type"}
            </p>
          </div>
          <span
            className={`rounded-xl px-3 py-2 text-caption ${
              isActive
                ? "bg-success/10 text-success"
                : "bg-black/[0.04] text-text-secondary dark:bg-white/[0.06]"
            }`}
          >
            {isActive ? "Active" : "Paused"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">
              Notification email
            </span>
            <Input
              value={notifyEmail}
              onChange={(event) => setNotifyEmail(event.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Date from</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Date to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild type="button">
            <Link href={searchHref}>View matching routes</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={() => saveChanges()}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => {
              const nextIsActive = !isActive;
              setIsActive(nextIsActive);
              void saveChanges(nextIsActive);
            }}
          >
            {isActive ? "Pause alert" : "Resume alert"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={removeAlert}
          >
            Delete
          </Button>
        </div>

        <p className="text-caption text-text-secondary">
          Alerts sent {alert.notificationCount} time(s).{" "}
          {alert.lastNotifiedAt
            ? `Last notified ${new Date(alert.lastNotifiedAt).toLocaleDateString("en-AU")}.`
            : "No matches yet."}
        </p>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </Card>
  );
}

function RouteRequestCard({ routeRequest }: { routeRequest: UnmatchedRequest }) {
  const primaryAction = getRouteAlertPrimaryAction(routeRequest);
  const statusText =
    routeRequest.status === "matched"
      ? "A new viable match was found for the same move request."
      : routeRequest.status === "expired" || routeRequest.status === "cancelled"
        ? "This recovery path closed without a new fit."
        : "moverrr is still watching this route after a request failed to convert.";

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Recovery alert</p>
            <h2 className="mt-1 text-heading text-text">
              {routeRequest.pickupSuburb} to {routeRequest.dropoffSuburb}
            </h2>
            <p className="mt-1 text-body text-text-secondary">
              {statusText}
            </p>
          </div>
          <span
            className={`rounded-xl px-3 py-2 text-caption ${
              routeRequest.status === "active"
                ? "bg-success/10 text-success"
                : routeRequest.status === "matched"
                  ? "bg-accent/10 text-accent"
                  : "bg-black/[0.04] text-text-secondary dark:bg-white/[0.06]"
            }`}
          >
            {routeRequest.status.replaceAll("_", " ")}
          </span>
        </div>
        <div className="grid gap-2 text-sm text-text-secondary">
          <p>{routeRequest.itemDescription}</p>
          {routeRequest.preferredDate ? <p>Preferred date: {routeRequest.preferredDate}</p> : null}
          {routeRequest.status === "matched" && routeRequest.matchedAt ? (
            <p>Matched {formatDateTime(routeRequest.matchedAt)}.</p>
          ) : null}
          <p>
            {routeRequest.lastNotifiedAt
              ? `Last route alert sent ${formatDateTime(routeRequest.lastNotifiedAt)}.`
              : "No recovered match has been sent yet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
          <Button asChild type="button" variant="secondary">
            <Link href="/bookings">Open requests</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ConciergeOfferCard({ offer }: { offer: CustomerConciergeOffer }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline") {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/concierge-offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update this concierge offer.");
      }

      if (action === "accept" && payload.bookingRequest?.id) {
        router.push(`/bookings/${payload.bookingRequest.id}`);
        return;
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update this concierge offer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Founder concierge</p>
            <h2 className="mt-1 text-heading text-text">{offer.carrierBusinessName}</h2>
            <p className="mt-1 text-body text-text-secondary">
              {offer.tripDate ? `${offer.tripDate} · ${offer.timeWindow ?? "timing to confirm"} · ` : ""}
              Founder-sourced corridor match routed back into normal booking flow.
            </p>
          </div>
          <span className="rounded-xl bg-accent/10 px-3 py-2 text-caption text-accent">
            {offer.status.replaceAll("_", " ")}
          </span>
        </div>
        <div className="grid gap-2 text-sm text-text-secondary">
          <p>Total price {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(offer.quotedTotalPriceCents / 100)}</p>
          {offer.note ? <p>{offer.note}</p> : null}
          {offer.sentAt ? <p>Sent {formatDateTime(offer.sentAt)}.</p> : null}
        </div>
        {offer.status === "sent" ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isSubmitting} onClick={() => void respond("accept")}>
              {isSubmitting ? "Sending request..." : "Accept and send request"}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => void respond("decline")}>
              Decline
            </Button>
          </div>
        ) : offer.bookingRequestId ? (
          <Button asChild type="button">
            <Link href={`/bookings/${offer.bookingRequestId}`}>Open request</Link>
          </Button>
        ) : null}
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </Card>
  );
}

export function AlertsManager({
  alerts,
  routeRequests,
  conciergeOffers,
}: {
  alerts: RouteAlert[];
  routeRequests: UnmatchedRequest[];
  conciergeOffers: CustomerConciergeOffer[];
}) {
  const activeRouteRequests = routeRequests.filter((entry) => entry.status === "active");
  const matchedRouteRequests = routeRequests.filter((entry) => entry.status === "matched");
  const expiredRouteRequests = routeRequests.filter((entry) =>
    ["expired", "cancelled"].includes(entry.status),
  );

  return (
    <div className="grid gap-4">
      {conciergeOffers.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="section-label">Founder-sourced matches</p>
            <h2 className="mt-1 text-lg text-text">Manual recovery routed back into moverrr</h2>
          </div>
          {conciergeOffers.map((offer) => (
            <ConciergeOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : null}
      {activeRouteRequests.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="section-label">Recovered route alerts</p>
            <h2 className="mt-1 text-lg text-text">Move intent carried forward after a failed request</h2>
          </div>
          {activeRouteRequests.map((routeRequest) => (
            <RouteRequestCard key={routeRequest.id} routeRequest={routeRequest} />
          ))}
        </div>
      ) : null}
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
      {matchedRouteRequests.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="section-label">Matched alerts</p>
            <h2 className="mt-1 text-lg text-text">Recovered demand that now has a viable route</h2>
          </div>
          {matchedRouteRequests.map((routeRequest) => (
            <RouteRequestCard key={routeRequest.id} routeRequest={routeRequest} />
          ))}
        </div>
      ) : null}
      {expiredRouteRequests.length > 0 ? (
        <div className="grid gap-4">
          <div>
            <p className="section-label">Expired alerts</p>
            <h2 className="mt-1 text-lg text-text">Recovery paths that closed without a new fit</h2>
          </div>
          {expiredRouteRequests.map((routeRequest) => (
            <RouteRequestCard key={routeRequest.id} routeRequest={routeRequest} />
          ))}
        </div>
      ) : null}
      {alerts.length === 0 && routeRequests.length === 0 && conciergeOffers.length === 0 ? (
        <Card className="p-4">
          <p className="subtle-text">
            No alerts yet. Turn on a route alert from search when moverrr does
            not find the right fit.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
