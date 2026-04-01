"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Trip } from "@/types/trip";

export function TripEditForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const initialState = useMemo(
    () => ({
      tripDate: trip.tripDate,
      timeWindow: trip.timeWindow,
      spaceSize: trip.spaceSize,
      status: trip.status ?? "active",
      availableVolumeM3: trip.availableVolumeM3.toString(),
      availableWeightKg: trip.availableWeightKg.toString(),
      detourRadiusKm: trip.detourRadiusKm.toString(),
      priceDollars: (trip.priceCents / 100).toString(),
      specialNotes: trip.rules.specialNotes ?? "",
    }),
    [trip],
  );
  const [formState, setFormState] = useState(initialState);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsDirty(JSON.stringify(formState) !== JSON.stringify(initialState));
  }, [formState, initialState]);

  useEffect(() => {
    if (!isDirty) {
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

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
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
          isReturnTrip: trip.isReturnTrip,
          status: formState.status,
          specialNotes: formState.specialNotes,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update trip.");
      }

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
          onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as typeof current.status }))}
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
