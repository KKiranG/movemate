import { AlertTriangle, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";
import type { BookingRequestStatus } from "@/types/booking-request";

const steps: {
  status: BookingStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "pending",
    label: "Request Submitted",
    description: "Carrier is reviewing your request inside the response window",
  },
  {
    status: "confirmed",
    label: "Accepted",
    description: "Carrier accepted and your move is now active in moverrr",
  },
  {
    status: "picked_up",
    label: "Pickup Due",
    description: "Carrier is now working the agreed pickup handoff",
  },
  {
    status: "in_transit",
    label: "In Transit",
    description: "On the way to delivery address",
  },
  {
    status: "delivered",
    label: "Delivered Pending Confirmation",
    description: "Delivery proof is in. Confirm receipt so payout can be released",
  },
  {
    status: "completed",
    label: "Complete",
    description: "Booking successfully completed",
  },
];

const statusOrder: BookingStatus[] = [
  "pending",
  "confirmed",
  "picked_up",
  "in_transit",
  "delivered",
  "completed",
];

const requestSteps: {
  status: BookingRequestStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "pending",
    label: "Request Submitted",
    description: "Carrier is reviewing fit, route, timing, and access details",
  },
  {
    status: "clarification_requested",
    label: "Clarification Needed",
    description: "Carrier needs one factual follow-up before deciding",
  },
  {
    status: "accepted",
    label: "Accepted",
    description: "Request accepted and converted into a live booking",
  },
];

const requestStatusOrder: BookingRequestStatus[] = [
  "pending",
  "clarification_requested",
  "accepted",
];

export function BookingStatusStepper({
  status,
  requestStatus,
}: {
  status?: BookingStatus;
  requestStatus?: BookingRequestStatus;
}) {
  if (requestStatus) {
    const currentIndex = requestStatusOrder.indexOf(requestStatus);

    if (requestStatus === "declined") {
      return <p className="font-medium text-error">This request was declined</p>;
    }

    if (requestStatus === "expired") {
      return <p className="font-medium text-error">This request expired without a final decision</p>;
    }

    if (requestStatus === "revoked") {
      return <p className="font-medium text-success">Another Fast Match carrier accepted first</p>;
    }

    if (requestStatus === "cancelled") {
      return <p className="font-medium text-error">This request was cancelled</p>;
    }

    return (
      <ol className="space-y-4">
        {requestSteps.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <li key={step.status} className="flex gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-medium transition-all",
                  isDone && "bg-success text-white",
                  isActive && "animate-pulse bg-accent text-white ring-4 ring-accent/10",
                  !isDone && !isActive && "bg-black/[0.06] text-text-secondary dark:bg-white/[0.08]",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div>
                <p
                  className={cn(
                    "font-medium",
                    isActive ? "text-text" : isDone ? "text-text" : "text-text-secondary",
                  )}
                >
                  {step.label}
                </p>
                {isActive ? (
                  <p className="text-sm text-text-secondary">
                    {step.description}
                    <span className="ml-2 inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                      Current
                    </span>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  if (!status) {
    return null;
  }

  const currentIndex = statusOrder.indexOf(status);

  if (status === "cancelled") {
    return <p className="font-medium text-error">Request cancelled</p>;
  }

  if (status === "disputed") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 font-medium text-orange-700">
        <AlertTriangle className="h-4 w-4" />
        Dispute open - our team will be in touch
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <li key={step.status} className="flex gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-medium transition-all",
                isDone && "bg-success text-white",
                isActive && "animate-pulse bg-accent text-white ring-4 ring-accent/10",
                !isDone && !isActive && "bg-black/[0.06] text-text-secondary dark:bg-white/[0.08]",
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <div>
              <p
                className={cn(
                  "font-medium",
                  isActive ? "text-text" : isDone ? "text-text" : "text-text-secondary",
                )}
              >
                {step.label}
              </p>
              {isActive ? (
                <p className="text-sm text-text-secondary">
                  {step.description}
                  <span className="ml-2 inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                    Current
                  </span>
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
