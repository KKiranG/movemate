"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type {
  RecurringTemplateSuggestion,
  TemplateInsight,
  TripTemplate,
} from "@/types/carrier";

function TemplateRow({
  template,
  insight,
}: {
  template: TripTemplate;
  insight?: TemplateInsight;
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mutate(
    method: "PATCH" | "DELETE",
    body?: Record<string, unknown>,
  ) {
    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/templates/${template.id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update template.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update template.",
      );
      setIsBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <p className="text-sm text-text-secondary">
              {template.originSuburb} to {template.destinationSuburb} ·{" "}
              {template.timeWindow} · Space {template.spaceSize}
            </p>
          </div>
          <div className="rounded-xl border border-border px-3 py-2 text-caption">
            {template.isArchived ? "Archived" : "Active"}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Trips posted</p>
            <p className="mt-2 text-2xl text-text">
              {insight?.tripCount ?? template.timesUsed}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Bookings</p>
            <p className="mt-2 text-2xl text-text">
              {insight?.bookingCount ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Completion rate</p>
            <p className="mt-2 text-2xl text-text">
              {insight?.completionRatePct ?? 0}%
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="section-label">Total earnings</p>
            <p className="mt-2 text-2xl text-text">
              {formatCurrency(insight?.totalEarningsCents ?? 0)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isBusy}
            onClick={() => mutate("PATCH", { name })}
          >
            Rename
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() =>
              mutate("PATCH", { isArchived: !template.isArchived })
            }
          >
            {template.isArchived ? "Unarchive" : "Archive"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() => mutate("PATCH", { action: "duplicate" })}
          >
            Duplicate
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() => mutate("DELETE")}
          >
            Delete
          </Button>
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </Card>
  );
}

export function TemplateLibrary({
  templates,
  insights,
  suggestions,
}: {
  templates: TripTemplate[];
  insights: TemplateInsight[];
  suggestions: RecurringTemplateSuggestion[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const insightByTemplateId = useMemo(
    () => new Map(insights.map((insight) => [insight.templateId, insight])),
    [insights],
  );

  async function createRecurringDraft(suggestion: RecurringTemplateSuggestion) {
    const templateId = suggestion.templateIds[0];

    if (!templateId) {
      return;
    }

    const response = await fetch(`/api/trips/templates/${templateId}/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripDate: suggestion.nextTripDate,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create recurring draft.");
      return;
    }

    setMessage(
      `Draft created for ${suggestion.routeLabel} on ${suggestion.nextTripDate}.`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {suggestions.length > 0 ? (
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <p className="section-label">Recurring helper</p>
              <h2 className="mt-1 text-lg text-text">
                Suggested weekly reposts
              </h2>
            </div>
            <div className="grid gap-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.routeLabel}
                  className="rounded-xl border border-border p-3"
                >
                  <p className="text-sm text-text">
                    {suggestion.routeLabel} appears repeatedly in your template
                    history.
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Suggested next run: {suggestion.nextWeekday},{" "}
                    {suggestion.nextTripDate}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => void createRecurringDraft(suggestion)}
                  >
                    Create draft trip
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {templates.map((template) => (
          <TemplateRow
            key={template.id}
            template={template}
            insight={insightByTemplateId.get(template.id)}
          />
        ))}
      </div>

      {templates.length === 0 ? (
        <Card className="p-4">
          <p className="subtle-text">
            No route templates yet. Save a trip as a template to build your
            quick-post library.
          </p>
        </Card>
      ) : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
    </div>
  );
}
