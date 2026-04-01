"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CarrierReviewResponseForm({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const request = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      const payload = await request.json();

      if (!request.ok) {
        throw new Error(payload.error ?? "Unable to post carrier response.");
      }

      setResponse("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to post carrier response.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Textarea
        value={response}
        onChange={(event) => setResponse(event.target.value)}
        placeholder="Reply once to add context for future customers."
        maxLength={400}
      />
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" variant="secondary" disabled={isSubmitting}>
        {isSubmitting ? "Posting response..." : "Post response"}
      </Button>
    </form>
  );
}
