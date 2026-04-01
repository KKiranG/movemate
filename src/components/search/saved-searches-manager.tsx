"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SavedSearch } from "@/types/customer";

function SavedSearchCard({ search }: { search: SavedSearch }) {
  const router = useRouter();
  const [notifyEmail, setNotifyEmail] = useState(search.notifyEmail);
  const [dateFrom, setDateFrom] = useState(search.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(search.dateTo ?? "");
  const [isActive, setIsActive] = useState(search.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveChanges(nextIsActive = isActive) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/saved-searches/${search.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          isActive: nextIsActive,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update saved search.");
      }

      setIsActive(payload.savedSearch.isActive);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update saved search.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeSearch() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/saved-searches/${search.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete saved search.");
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete saved search.");
      setIsSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Saved search</p>
            <h2 className="mt-1 text-heading text-text">
              {search.fromSuburb} to {search.toSuburb}
            </h2>
            <p className="mt-1 text-body text-text-secondary">
              {search.itemCategory ? `Looking for ${search.itemCategory} capacity` : "Any item category"}
            </p>
          </div>
          <span
            className={`rounded-xl px-3 py-2 text-caption ${
              isActive ? "bg-success/10 text-success" : "bg-black/[0.04] text-text-secondary dark:bg-white/[0.06]"
            }`}
          >
            {isActive ? "Active" : "Paused"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Notify email</span>
            <Input value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Date from</span>
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Date to</span>
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={isSaving} onClick={() => saveChanges()}>
            {isSaving ? "Saving..." : "Save edits"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => {
              const nextIsActive = !isActive;
              setIsActive(nextIsActive);
              void saveChanges(nextIsActive);
            }}
          >
            {isActive ? "Pause alert" : "Resume alert"}
          </Button>
          <Button type="button" variant="ghost" disabled={isSaving} onClick={removeSearch}>
            Delete
          </Button>
        </div>

        <p className="text-caption text-text-secondary">
          Alerts sent {search.notificationCount} time(s). Last notified{" "}
          {search.lastNotifiedAt ? new Date(search.lastNotifiedAt).toLocaleDateString("en-AU") : "never"}.
        </p>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </Card>
  );
}

export function SavedSearchesManager({ searches }: { searches: SavedSearch[] }) {
  return (
    <div className="grid gap-4">
      {searches.map((search) => (
        <SavedSearchCard key={search.id} search={search} />
      ))}
      {searches.length === 0 ? (
        <Card className="p-4">
          <p className="subtle-text">No saved searches yet. Save a no-results route from browse to get alerts.</p>
        </Card>
      ) : null}
    </div>
  );
}
