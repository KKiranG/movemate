import { AlertTriangle, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";

const steps: {
  status: BookingStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "pending",
    label: "Awaiting Confirmation",
    description: "Carrier has 2 hours to confirm",
  },
  {
    status: "confirmed",
    label: "Confirmed",
    description: "Carrier has accepted your booking",
  },
  {
    status: "picked_up",
    label: "Picked Up",
    description: "Item collected from pickup address",
  },
  {
    status: "in_transit",
    label: "In Transit",
    description: "On the way to delivery address",
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Item delivered - please confirm receipt",
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

export function BookingStatusStepper({
  status,
}: {
  status: BookingStatus;
}) {
  const currentIndex = statusOrder.indexOf(status);

  if (status === "cancelled") {
    return <p className="font-medium text-error">Booking cancelled</p>;
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
