"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, getTodayIsoDate } from "@/lib/utils";
import { getTripPublishReadiness } from "@/lib/validation/trip";
import type { Trip } from "@/types/trip";

const acceptOptions = [
  { value: "furniture", label: "Furniture" },
  { value: "boxes", label: "Boxes" },
  { value: "appliance", label: "Appliance" },
  { value: "fragile", label: "Fragile" },
] as const;

type EditableTripStatus = "draft" | "active" | "cancelled";

export function TripEditForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const minimumTripDate = useMemo(() => getTodayIsoDate(), []);
  const initialState = useMemo(
    () => ({
      tripDate: trip.tripDate,
      timeWindow: trip.timeWindow,
      spaceSize: trip.spaceSize,
      status:
        trip.status === "draft" || trip.status === "cancelled"
          ? trip.status
          : "active" as EditableTripStatus,
      availableVolumeM3: trip.availableVolumeM3.toString(),
      availableWeightKg: trip.availableWeightKg.toString(),
      detourRadiusKm: trip.detourRadiusKm.toString(),
      priceDollars: (trip.priceCents / 100).toString(),
      accepts: trip.rules.accepts,
      stairsOk: trip.rules.stairsOk ? "yes" : "no",
      stairsExtraDollars: (trip.rules.stairsExtraCents / 100).toString(),
      helperAvailable: trip.rules.helperAvailable ? "yes" : "no",
      helperExtraDollars: (trip.rules.helperExtraCents / 100).toString(),
      specialNotes: trip.rules.specialNotes ?? "",
    }),
    [trip],
  );
  const [formState, setFormState] = useState(initialState);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navigationGuardEnabled, setNavigationGuardEnabled] = useState(true);
  const beforeUnloadHandlerRef = useRef<((event: BeforeUnloadEvent) => void) | null>(null);
  const documentClickHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);

  function clearNavigationGuardListeners() {
    if (beforeUnloadHandlerRef.current) {
      window.removeEventListener("beforeunload", beforeUnloadHandlerRef.current);
      beforeUnloadHandlerRef.current = null;
    }

    if (documentClickHandlerRef.current) {
      document.removeEventListener("click", documentClickHandlerRef.current, true);
      documentClickHandlerRef.current = null;
    }
  }

  useEffect(() => {
    setIsDirty(JSON.stringify(formState) !== JSON.stringify(initialState));
  }, [formState, initialState]);

  useEffect(() => {
    clearNavigationGuardListeners();

    if (!isDirty || !navigationGuardEnabled) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!anchor) {
        return;
      }

      if (!window.confirm("Discard unsaved changes to this trip?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    beforeUnloadHandlerRef.current = handleBeforeUnload;
    documentClickHandlerRef.current = handleDocumentClick;
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      clearNavigationGuardListeners();
    };
  }, [isDirty, navigationGuardEnabled]);

  const publishIssues = useMemo(
    () =>
      getTripPublishReadiness({
        status: formState.status,
        spaceSize: formState.spaceSize,
        availableVolumeM3: Number(formState.availableVolumeM3) || 0,
        availableWeightKg: Number(formState.availableWeightKg) || 0,
        accepts: formState.accepts as Array<
          "furniture" | "boxes" | "appliance" | "fragile" | "other"
        >,
        specialNotes: formState.specialNotes,
        helperAvailable: formState.helperAvailable === "yes",
        stairsOk: formState.stairsOk === "yes",
      }),
    [formState],
  );
  const blockingPublishIssues = publishIssues.filter((issue) => issue.severity === "blocking");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (formState.status === "active" && blockingPublishIssues.length > 0) {
        throw new Error("Resolve the publish blockers below or switch this listing back to draft.");
      }

      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripDate: formState.tripDate,
          timeWindow: formState.timeWindow,
          spaceSize: formState.spaceSize,
          availableVolumeM3: Number(formState.availableVolumeM3),
          availableWeightKg: Number(formState.availableWeightKg),
          detourRadiusKm: Number(formState.detourRadiusKm),
          priceCents: Math.round(Number(formState.priceDollars) * 100),
          accepts: formState.accepts,
          stairsOk: formState.stairsOk === "yes",
          stairsExtraCents: Math.round(Number(formState.stairsExtraDollars) * 100),
          helperAvailable: formState.helperAvailable === "yes",
          helperExtraCents: Math.round(Number(formState.helperExtraDollars) * 100),
          isReturnTrip: trip.isReturnTrip,
          status: formState.status,
          specialNotes: formState.specialNotes,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update trip.");
      }

      clearNavigationGuardListeners();
      setNavigationGuardEnabled(false);
      setIsDirty(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update trip.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function maybeReset() {
    if (!isDirty || window.confirm("Discard unsaved changes?")) {
      setFormState(initialState);
      setIsDirty(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          name="tripDate"
          type="date"
          min={minimumTripDate}
          value={formState.tripDate}
          onChange={(event) => setFormState((current) => ({ ...current, tripDate: event.target.value }))}
          required
        />
        <select
          name="timeWindow"
          value={formState.timeWindow}
          onChange={(event) => setFormState((current) => ({ ...current, timeWindow: event.target.value as Trip["timeWindow"] }))}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="flexible">Flexible</option>
        </select>
        <select
          name="spaceSize"
          value={formState.spaceSize}
          onChange={(event) => setFormState((current) => ({ ...current, spaceSize: event.target.value as Trip["spaceSize"] }))}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
        >
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>
        <select
          name="status"
          value={formState.status}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              status: event.target.value as EditableTripStatus,
            }))}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          name="availableVolumeM3"
          type="number"
          step="0.1"
          value={formState.availableVolumeM3}
          onChange={(event) => setFormState((current) => ({ ...current, availableVolumeM3: event.target.value }))}
          required
        />
        <Input
          name="availableWeightKg"
          type="number"
          step="1"
          value={formState.availableWeightKg}
          onChange={(event) => setFormState((current) => ({ ...current, availableWeightKg: event.target.value }))}
          required
        />
        <Input
          name="detourRadiusKm"
          type="number"
          step="1"
          value={formState.detourRadiusKm}
          onChange={(event) => setFormState((current) => ({ ...current, detourRadiusKm: event.target.value }))}
          required
        />
        <Input
          name="priceDollars"
          type="number"
          step="1"
          value={formState.priceDollars}
          onChange={(event) => setFormState((current) => ({ ...current, priceDollars: event.target.value }))}
          required
        />
      </div>

      {trip.suggestedPriceCents ? (
        <p className="text-sm text-text-secondary">
          Suggested at posting: {formatCurrency(Math.max(0, trip.suggestedPriceCents - 1000))} to{" "}
          {formatCurrency(trip.suggestedPriceCents + 1000)}
        </p>
      ) : null}

      <div
        className={`rounded-xl border p-3 ${
          blockingPublishIssues.length > 0
            ? "border-warning/20 bg-warning/10"
            : "border-border bg-black/[0.02] dark:bg-white/[0.04]"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Publish readiness</p>
            <p className="mt-1 text-sm text-text">
              {blockingPublishIssues.length > 0
                ? "This listing needs capacity fixes before it should stay live."
                : "Capacity and accepted item types are still aligned for browse."}
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            {blockingPublishIssues.length} blockers
          </span>
        </div>
        {publishIssues.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {publishIssues.map((issue) => (
              <div
                key={issue.code}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  issue.severity === "blocking"
                    ? "border-warning/20 bg-white/70 text-text"
                    : "border-border bg-background text-text-secondary"
                }`}
              >
                <p className="font-medium text-text">{issue.message}</p>
                <p className="mt-1">{issue.hint}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {acceptOptions.map((option) => {
            const isSelected = formState.accepts.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setFormState((current) => ({
                    ...current,
                    accepts: current.accepts.includes(option.value)
                      ? current.accepts.filter((value) => value !== option.value)
                      : [...current.accepts, option.value],
                  }))
                }
                className={`min-h-[44px] rounded-xl border px-3 py-3 text-left text-sm ${
                  isSelected
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Stairs support</span>
            <select
              name="stairsOk"
              value={formState.stairsOk}
              onChange={(event) => setFormState((current) => ({ ...current, stairsOk: event.target.value as "yes" | "no" }))}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              <option value="no">No stairs support</option>
              <option value="yes">Stairs OK</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Stairs surcharge (AUD)</span>
            <Input
              name="stairsExtraDollars"
              type="number"
              step="1"
              value={formState.stairsExtraDollars}
              onChange={(event) => setFormState((current) => ({ ...current, stairsExtraDollars: event.target.value }))}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Helper support</span>
            <select
              name="helperAvailable"
              value={formState.helperAvailable}
              onChange={(event) => setFormState((current) => ({ ...current, helperAvailable: event.target.value as "yes" | "no" }))}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              <option value="no">No helper</option>
              <option value="yes">Helper available</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Helper surcharge (AUD)</span>
            <Input
              name="helperExtraDollars"
              type="number"
              step="1"
              value={formState.helperExtraDollars}
              onChange={(event) => setFormState((current) => ({ ...current, helperExtraDollars: event.target.value }))}
            />
          </label>
        </div>
      </div>

      <Textarea
        name="specialNotes"
        value={formState.specialNotes}
        onChange={(event) => setFormState((current) => ({ ...current, specialNotes: event.target.value }))}
        placeholder="Operational notes for this listing"
      />
      {isDirty ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-text">
          You have unsaved trip changes. Navigating away will ask for confirmation.
        </div>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={maybeReset}>
          Discard changes
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving trip..." : "Save trip changes"}
        </Button>
      </div>
    </form>
  );
}
