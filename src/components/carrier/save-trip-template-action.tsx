"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SaveTripTemplateAction({
  tripId,
  defaultName,
}: {
  tripId: string;
  defaultName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/trips/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, name }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save template.");
      }

      setMessage(
        "Template saved — post this route in one tap from carrier home.",
      );
      setIsOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save template.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        className="min-h-[44px] active:opacity-80"
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? "Close template form" : "Save as template"}
      </Button>
      {isOpen ? (
        <form
          className="grid gap-3 rounded-xl border border-border p-3"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Template name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Weekly Wollongong Run"
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] active:opacity-80"
            >
              {isSubmitting ? "Saving..." : "Save template"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-[44px] active:opacity-80"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
    </div>
  );
}
