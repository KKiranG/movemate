"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RequestClarificationResponseForm({
  bookingRequestId,
}: {
  bookingRequestId: string;
}) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const request = await fetch(`/api/booking-requests/${bookingRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerResponse: response,
        }),
      });
      const payload = await request.json();

      if (!request.ok) {
        throw new Error(payload.error ?? "Unable to send clarification reply.");
      }

      setResponse("");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to send clarification reply.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Textarea
        value={response}
        maxLength={280}
        onChange={(event) => setResponse(event.target.value)}
        placeholder="Answer only the missing fact the carrier asked for, such as access, timing, or photo context."
      />
      <p className="text-xs text-text-secondary">
        Keep this factual and specific. MoveMate allows one clarification round, not open-ended negotiation.
      </p>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting || response.trim().length === 0}>
        {isSubmitting ? "Sending reply..." : "Send clarification reply"}
      </Button>
    </form>
  );
}
