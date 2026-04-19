"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CarrierProfile } from "@/types/carrier";

export function VerifyCarrierActions({
  carrier,
  notes,
}: {
  carrier: CarrierProfile;
  notes?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(isApproved: boolean, notes?: string) {
    setError(null);

    if (!isApproved && !notes?.trim()) {
      setError("Add a rejection reason before rejecting this carrier.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/carriers/${carrier.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved, notes }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Unable to update carrier verification.",
        );
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update carrier verification.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit(true, notes)}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Approve
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => submit(false, notes)}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Reject
        </Button>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
