"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ResolveDisputeActions({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"keep" | "completed" | "cancelled">("keep");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<
    "investigating" | "resolved" | "closed" | null
  >(null);

  async function submit(status: "investigating" | "resolved" | "closed") {
    if (resolutionNotes.trim().length < 20) {
      setError("Add at least 20 characters so the audit trail is useful.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setActiveAction(status);

    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolutionNotes,
          bookingStatus: bookingStatus === "keep" ? undefined : bookingStatus,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update dispute.");
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update dispute.");
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={resolutionNotes}
        onChange={(event) => setResolutionNotes(event.target.value)}
        placeholder="Admin notes, evidence summary, refund/credit decision, next action"
        disabled={isSubmitting}
        minLength={20}
      />
      <p className="text-xs text-text-secondary">
        Resolution notes are required and should be at least 20 characters.
      </p>
      <select
        value={bookingStatus}
        onChange={(event) => setBookingStatus(event.target.value as "keep" | "completed" | "cancelled")}
        disabled={isSubmitting}
        className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
      >
        <option value="keep">Keep booking status as-is</option>
        <option value="completed">Mark booking completed</option>
        <option value="cancelled">Mark booking cancelled</option>
      </select>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting || resolutionNotes.trim().length < 20}
          onClick={() => submit("investigating")}
        >
          {activeAction === "investigating" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Mark investigating
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || resolutionNotes.trim().length < 20}
          onClick={() => submit("resolved")}
        >
          {activeAction === "resolved" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Resolve dispute
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting || resolutionNotes.trim().length < 20}
          onClick={() => submit("closed")}
        >
          {activeAction === "closed" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Close
        </Button>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
