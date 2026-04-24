"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function TripFreshnessActions({
  tripId,
  canUnsuspend,
}: {
  tripId: string;
  canUnsuspend: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnsuspend() {
    setError(null);
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/trips/${tripId}/freshness`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unsuspend",
          reason,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to unsuspend this trip.");
      }

      setReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to unsuspend this trip.");
    } finally {
      setBusy(false);
    }
  }

  if (!canUnsuspend) {
    return (
      <p className="text-sm text-text-secondary">
        MoveMate is still waiting on the carrier freshness response.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Why ops is unsuspending this trip after manual reconfirmation"
        maxLength={280}
      />
      <Button
        type="button"
        variant="secondary"
        className="min-h-[44px]"
        disabled={busy || reason.trim().length < 12}
        onClick={() => void handleUnsuspend()}
      >
        {busy ? "Unsuspending..." : "Unsuspend after reconfirmation"}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
