"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PaymentRecoveryCard({
  bookingId,
  title,
  description,
}: {
  bookingId: string;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function retryPayment() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to restart payment.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to restart payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-error/20 bg-error/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-error" />
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-text">{title}</p>
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          </div>
          <Button type="button" onClick={retryPayment} disabled={isSubmitting}>
            {isSubmitting ? "Retrying payment..." : "Retry payment"}
          </Button>
          {error ? <p className="text-sm text-error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
