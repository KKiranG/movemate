import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { MoveRequest } from "@/types/move-request";

function getMoveRequestStatusLabel(status: MoveRequest["status"]) {
  switch (status) {
    case "booking_requested":
      return "Request sent";
    case "booked":
      return "Booked";
    case "matched":
      return "Matches ready";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    case "draft":
      return "Draft";
    default:
      return "Submitted";
  }
}

function getMoveRequestPrimaryAction(request: MoveRequest) {
  const searchHref = `/search?${new URLSearchParams({
    from: request.route.pickupSuburb,
    to: request.route.dropoffSuburb,
    ...(request.route.preferredDate ? { when: request.route.preferredDate } : {}),
    what: request.item.category,
    moveRequestId: request.id,
  }).toString()}`;

  if (request.status === "booking_requested" || request.status === "booked") {
    return {
      href: "/bookings",
      label: request.status === "booked" ? "Open bookings" : "Track request",
    };
  }

  if (request.status === "expired" || request.status === "cancelled") {
    return {
      href: searchHref,
      label: "Restart this move",
    };
  }

  return {
    href: searchHref,
    label: "Open this move",
  };
}

export function RecentMoveRequests({ requests }: { requests: MoveRequest[] }) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-label">Recent move requests</p>
          <h2 className="mt-1 text-2xl text-text">Pick up where you left off</h2>
        </div>
        <Button asChild variant="secondary">
          <Link href="#homepage-search">Start a new move</Link>
        </Button>
      </div>
      <div className="grid gap-3">
        {requests.map((request) => {
          const action = getMoveRequestPrimaryAction(request);

          return (
            <Card key={request.id} className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base text-text">
                      {request.route.pickupSuburb} to {request.route.dropoffSuburb}
                    </p>
                    <span className="rounded-xl border border-border px-3 py-1 text-xs uppercase tracking-[0.16em] text-text-secondary">
                      {getMoveRequestStatusLabel(request.status)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{request.item.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
                    {request.route.preferredDate ? (
                      <span>Preferred date: {formatDate(request.route.preferredDate)}</span>
                    ) : null}
                    <span>
                      {request.needsStairs ? "Stairs flagged" : "No stairs"} ·{" "}
                      {request.needsHelper ? "Helper requested" : "No helper"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 lg:min-w-[220px]">
                  <Button asChild className="min-h-[44px]">
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                  <Button asChild variant="ghost" className="min-h-[44px]">
                    <Link
                      href={`/search?${new URLSearchParams({
                        from: request.route.pickupSuburb,
                        to: request.route.dropoffSuburb,
                        ...(request.route.preferredDate ? { when: request.route.preferredDate } : {}),
                        what: request.item.category,
                      }).toString()}`}
                    >
                      Search similar routes
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
