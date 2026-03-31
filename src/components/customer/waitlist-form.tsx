"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WaitlistFormProps {
  from: string;
  to: string;
  when?: string;
  what?: string;
}

export function WaitlistForm({ from, to, when, what }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          from,
          to,
          preferredDate: when,
          itemCategory: what ?? "other",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to join the waitlist.");
      }

      setMessage("Thanks. We’ll use this route request in the launch waitlist and concierge flow.");
      setEmail("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to join the waitlist.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-text">Email</span>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      <Button type="submit" variant="secondary" disabled={isSubmitting}>
        {isSubmitting ? "Saving alert..." : "Get notified"}
      </Button>
    </form>
  );
}
