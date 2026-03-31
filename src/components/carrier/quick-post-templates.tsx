"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TripTemplate } from "@/types/carrier";

function getTomorrowIsoDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export function QuickPostTemplates({
  templates,
}: {
  templates: TripTemplate[];
}) {
  const router = useRouter();
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [tripDate, setTripDate] = useState(getTomorrowIsoDate());
  const [timeWindow, setTimeWindow] = useState<TripTemplate["timeWindow"]>("flexible");
  const [priceDollars, setPriceDollars] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [successTripId, setSuccessTripId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === activeTemplateId) ?? null,
    [activeTemplateId, templates],
  );

  function openComposer(template: TripTemplate) {
    setActiveTemplateId(template.id);
    setTripDate(getTomorrowIsoDate());
    setTimeWindow(template.timeWindow);
    setPriceDollars((template.suggestedPriceCents / 100).toFixed(0));
    setError(null);
    setSuccessTripId(null);
  }

  async function quickPost() {
    if (!activeTemplate) {
      return;
    }

    setError(null);
    setSuccessTripId(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trips/templates/${activeTemplate.id}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripDate,
          timeWindow,
          priceCents: Math.round(Number(priceDollars) * 100),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to post trip from template.");
      }

      setSuccessTripId(payload.trip.id);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to post trip from template.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-label">Quick Post</p>
            <h2 className="mt-1 text-lg text-text">Post from a saved route in one tap</h2>
          </div>
          <Button asChild variant="ghost" className="min-h-[44px] active:opacity-80">
            <Link href="/carrier/trips">Manage trips</Link>
          </Button>
        </div>

        {templates.length === 0 ? (
          <p className="subtle-text">
            Save a route as a template from any trip detail page to quick-post it later.
          </p>
        ) : (
          <div className="grid gap-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text">{template.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {template.originSuburb} to {template.destinationSuburb} · Space {template.spaceSize}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-[44px] active:opacity-80"
                    onClick={() => openComposer(template)}
                  >
                    Post
                  </Button>
                </div>
                {activeTemplateId === template.id ? (
                  <div className="mt-3 grid gap-3 rounded-xl bg-black/[0.02] p-3 dark:bg-white/[0.04]">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-text">Trip date</span>
                        <Input
                          type="date"
                          value={tripDate}
                          onChange={(event) => setTripDate(event.target.value)}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-text">Time window</span>
                        <select
                          value={timeWindow}
                          onChange={(event) =>
                            setTimeWindow(event.target.value as TripTemplate["timeWindow"])
                          }
                          className="min-h-[44px] rounded-xl border border-border bg-surface px-3 text-sm text-text"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-text">Price (AUD)</span>
                        <Input
                          type="number"
                          min="10"
                          step="1"
                          value={priceDollars}
                          onChange={(event) => setPriceDollars(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        className="min-h-[44px] active:opacity-80"
                        onClick={quickPost}
                      >
                        {isSubmitting ? "Posting..." : "Confirm quick post"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-[44px] active:opacity-80"
                        onClick={() => setActiveTemplateId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {successTripId ? (
          <p className="text-sm text-success">
            Trip posted!{" "}
            <Link href={`/carrier/trips/${successTripId}`} className="font-medium underline">
              View your listing
            </Link>
          </p>
        ) : null}
      </div>
    </Card>
  );
}
