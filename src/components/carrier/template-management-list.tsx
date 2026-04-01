"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TripTemplate } from "@/types/carrier";

export function TemplateManagementList({ templates }: { templates: TripTemplate[] }) {
  const router = useRouter();
  const [names, setNames] = useState<Record<string, string>>(
    Object.fromEntries(templates.map((template) => [template.id, template.name])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mutateTemplate(
    templateId: string,
    payload: Record<string, unknown>,
    method: "PATCH" | "DELETE" = "PATCH",
  ) {
    setError(null);
    setBusyId(templateId);

    try {
      const response = await fetch(`/api/trips/templates/${templateId}`, {
        method,
        headers: method === "PATCH" ? { "Content-Type": "application/json" } : undefined,
        body: method === "PATCH" ? JSON.stringify(payload) : undefined,
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to update template.");
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update template.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-medium text-text">{template.name}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {template.originSuburb} to {template.destinationSuburb} · {template.timeWindow}
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">
              {template.isArchived ? "Archived" : "Active"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              value={names[template.id] ?? template.name}
              onChange={(event) =>
                setNames((current) => ({ ...current, [template.id]: event.target.value }))
              }
            />
            <Button
              type="button"
              variant="secondary"
              disabled={busyId === template.id}
              onClick={() =>
                mutateTemplate(template.id, {
                  name: names[template.id] ?? template.name,
                })
              }
            >
              Rename
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={busyId === template.id}
              onClick={() =>
                mutateTemplate(template.id, {
                  action: "duplicate",
                })
              }
            >
              Duplicate
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busyId === template.id}
              onClick={() =>
                mutateTemplate(template.id, {
                  isArchived: !template.isArchived,
                })
              }
            >
              {template.isArchived ? "Unarchive" : "Archive"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busyId === template.id}
              onClick={() => mutateTemplate(template.id, {}, "DELETE")}
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
