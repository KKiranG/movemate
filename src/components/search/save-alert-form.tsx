"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SaveAlertForm({
  fromSuburb,
  toSuburb,
  itemCategory,
  dateFrom,
  userEmail,
}: {
  fromSuburb: string;
  toSuburb: string;
  itemCategory?: string;
  dateFrom?: string;
  userEmail: string;
}) {
  const [email, setEmail] = useState(userEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromSuburb,
          toSuburb,
          itemCategory,
          dateFrom,
          dateTo: dateFrom,
          notifyEmail: email,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to turn on this alert.");
      }

      setMessage(`Alert active at ${email}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to turn on this alert.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-text">
          Notification email
        </span>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-success">✓ {message}</p> : null}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="min-h-[44px] active:opacity-80"
      >
        {isSubmitting ? "Saving..." : "Turn on alerts"}
      </Button>
    </form>
  );
}
