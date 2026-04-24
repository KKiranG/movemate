"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ConciergeOfferForm({
  unmatchedRequestId,
  carrierOptions,
}: {
  unmatchedRequestId: string;
  carrierOptions: Array<{
    listingId: string;
    carrierId: string;
    businessName: string;
    tripDate: string;
    timeWindow: string;
    basePriceCents: number;
  }>;
}) {
  const router = useRouter();
  const [carrierId, setCarrierId] = useState(carrierOptions[0]?.carrierId ?? "");
  const [quotedTotalPrice, setQuotedTotalPrice] = useState(
    carrierOptions[0] ? String(Math.round(carrierOptions[0].basePriceCents / 100)) : "",
  );
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/concierge-offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unmatchedRequestId,
          listingId:
            carrierOptions.find((option) => option.carrierId === carrierId)?.listingId ?? undefined,
          carrierId,
          quotedTotalPriceCents: Math.round(Number(quotedTotalPrice) * 100),
          note,
          sendNow: true,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create concierge offer.");
      }

      setNote("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create concierge offer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (carrierOptions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-black/[0.02] p-3 text-sm text-text-secondary dark:bg-white/[0.04]">
        No direct corridor carrier suggestions yet. Use the operator task to follow up manually.
      </div>
    );
  }

  return (
    <form className="grid gap-3 rounded-xl border border-border p-3" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-medium text-text">Create concierge offer</p>
        <p className="mt-1 text-sm text-text-secondary">
          Send a founder-sourced match tied to this route request so the customer can continue through MoveMate instead of leaving the platform.
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-text">Suggested carrier</span>
        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
          value={carrierId}
          onChange={(event) => setCarrierId(event.target.value)}
        >
          {carrierOptions.map((option) => (
            <option key={option.carrierId} value={option.carrierId}>
              {option.businessName} · {option.tripDate} · {option.timeWindow}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-text">Quoted total (AUD)</span>
        <Input
          type="number"
          min="1"
          step="1"
          value={quotedTotalPrice}
          onChange={(event) => setQuotedTotalPrice(event.target.value)}
          placeholder="140"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-text">Ops note</span>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Why this founder-sourced offer is worth sending and any constraints to keep visible."
          maxLength={280}
        />
      </label>

      <Button type="submit" disabled={isSubmitting || !carrierId || !quotedTotalPrice.trim()}>
        {isSubmitting ? "Sending concierge offer..." : "Send concierge offer"}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}
