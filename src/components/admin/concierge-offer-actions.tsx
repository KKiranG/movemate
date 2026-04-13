"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConciergeOfferActions({
  conciergeOfferId,
  status,
}: {
  conciergeOfferId: string;
  status: "draft" | "sent" | "accepted" | "declined" | "cancelled";
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelOffer() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/concierge-offers/${conciergeOfferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: reason.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to cancel this concierge offer.");
      }

      setReason("");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to cancel this concierge offer.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (status === "accepted" || status === "cancelled") {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Why ops is cancelling or withdrawing this concierge offer"
        maxLength={280}
      />
      <Button type="button" variant="ghost" disabled={busy} onClick={() => void cancelOffer()}>
        {busy ? "Saving..." : status === "sent" ? "Withdraw concierge offer" : "Cancel draft"}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
