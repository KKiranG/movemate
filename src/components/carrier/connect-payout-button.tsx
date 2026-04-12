"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ConnectPayoutButton({
  variant = "primary",
  label = "Set up payouts",
}: {
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startConnectFlow() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/carrier/stripe/connect-start", {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start payout setup.");
      }

      window.location.href = payload.url as string;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start payout setup.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        disabled={isSubmitting}
        onClick={() => void startConnectFlow()}
      >
        {isSubmitting ? "Opening Stripe..." : label}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
