"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  GoogleAutocompleteInput,
  type AddressValue,
} from "@/components/shared/google-autocomplete-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { suggestPrice } from "@/lib/pricing/suggest";

const steps = ["Route", "When & space", "Price & rules"] as const;
const acceptOptions = [
  { value: "furniture", label: "Furniture" },
  { value: "boxes", label: "Boxes" },
  { value: "appliance", label: "Appliance" },
  { value: "fragile", label: "Fragile" },
] as const;
const sizeDescriptions: Record<"S" | "M" | "L" | "XL", string> = {
  S: "1-2 boxes or a compact marketplace pickup",
  M: "One furniture piece like a desk, chair, or washing machine",
  L: "Several bulky items or a light studio move",
  XL: "Large pieces that take most of the spare bay",
};

export function CarrierTripWizard({
  initialOrigin = null,
  initialDestination = null,
  initialSpaceSize = "M",
  initialPriceDollars,
  initialDetourRadiusKm,
}: {
  initialOrigin?: AddressValue | null;
  initialDestination?: AddressValue | null;
  initialSpaceSize?: "S" | "M" | "L" | "XL";
  initialPriceDollars?: string;
  initialDetourRadiusKm?: string;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [origin, setOrigin] = useState<AddressValue | null>(initialOrigin);
  const [destination, setDestination] = useState<AddressValue | null>(initialDestination);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spaceSize, setSpaceSize] = useState<"S" | "M" | "L" | "XL">(initialSpaceSize);
  const [accepts, setAccepts] = useState<string[]>(["furniture", "boxes", "appliance"]);
  const [specialNotes, setSpecialNotes] = useState("");

  const pricingSuggestion = useMemo(
    () =>
      suggestPrice({
        distanceKm: 35,
        spaceSize,
        needsStairs: false,
        needsHelper: false,
        isReturn: true,
      }),
    [spaceSize],
  );
  const [priceDollars, setPriceDollars] = useState(
    initialPriceDollars ?? Math.round(pricingSuggestion.midCents / 100).toString(),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!origin || !destination) {
      setError("Choose origin and destination from the address suggestions.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originSuburb: origin.suburb,
          originPostcode: origin.postcode,
          originLatitude: origin.latitude,
          originLongitude: origin.longitude,
          destinationSuburb: destination.suburb,
          destinationPostcode: destination.postcode,
          destinationLatitude: destination.latitude,
          destinationLongitude: destination.longitude,
          detourRadiusKm: Number(formData.get("detourRadiusKm")),
          tripDate: formData.get("tripDate"),
          timeWindow: formData.get("timeWindow"),
          spaceSize,
          availableVolumeM3: Number(formData.get("availableVolumeM3")),
          availableWeightKg: Number(formData.get("availableWeightKg")),
          priceCents: Math.round(Number(formData.get("priceDollars")) * 100),
          suggestedPriceCents: pricingSuggestion.midCents,
          accepts,
          stairsOk: formData.get("stairsOk") === "yes",
          stairsExtraCents:
            Math.round(Number(formData.get("stairsExtraDollars") || 0) * 100),
          helperAvailable: formData.get("helperAvailable") === "yes",
          helperExtraCents:
            Math.round(Number(formData.get("helperExtraDollars") || 0) * 100),
          status: formData.get("status"),
          specialNotes: formData.get("specialNotes"),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create trip.");
      }

      router.push("/carrier/trips?posted=1");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create trip.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="flex gap-2 overflow-x-auto">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStepIndex(index)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-sm transition-colors ${
              index === stepIndex
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-secondary active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {stepIndex === 0 ? (
        <div className="grid gap-4">
          <GoogleAutocompleteInput
            name="originAddress"
            placeholder="Origin suburb or address"
            initialResolvedValue={initialOrigin}
            onResolved={setOrigin}
          />
          <GoogleAutocompleteInput
            name="destinationAddress"
            placeholder="Destination suburb or address"
            initialResolvedValue={initialDestination}
            onResolved={setDestination}
          />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Detour radius (km)</span>
            <Input
              name="detourRadiusKm"
              type="number"
              step="1"
              defaultValue={initialDetourRadiusKm ?? "10"}
              placeholder="Detour radius km"
              required
            />
          </label>
        </div>
      ) : null}

      {stepIndex === 1 ? (
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Trip date</span>
            <Input name="tripDate" type="date" required />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Time window</span>
            <select
              name="timeWindow"
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
              defaultValue="flexible"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Space size</span>
            <select
              name="spaceSize"
              value={spaceSize}
              onChange={(event) => setSpaceSize(event.target.value as "S" | "M" | "L" | "XL")}
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </label>
          <p className="text-sm text-text-secondary">{sizeDescriptions[spaceSize]}</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Available volume (m3)</span>
            <Input
              name="availableVolumeM3"
              type="number"
              step="0.1"
              defaultValue="1"
              placeholder="Available volume m3"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Available weight (kg)</span>
            <Input
              name="availableWeightKg"
              type="number"
              step="1"
              defaultValue="100"
              placeholder="Available weight kg"
              required
            />
          </label>
        </div>
      ) : null}

      {stepIndex === 2 ? (
        <div className="grid gap-4">
          <p className="text-sm text-text-secondary">
            Suggested range ${pricingSuggestion.lowCents / 100} to $
            {pricingSuggestion.highCents / 100}
          </p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Price in dollars</span>
            <Input
              name="priceDollars"
              type="number"
              step="1"
              value={priceDollars}
              onChange={(event) => setPriceDollars(event.target.value)}
              placeholder="Price in dollars"
              required
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {acceptOptions.map((option) => {
              const isSelected = accepts.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setAccepts((current) =>
                      current.includes(option.value)
                        ? current.filter((value) => value !== option.value)
                        : [...current, option.value],
                    )
                  }
                  className={`min-h-11 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
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
          {accepts.map((value) => (
            <input key={value} type="hidden" name="accepts" value={value} />
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Stairs support</span>
              <select
                name="stairsOk"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
                defaultValue="no"
              >
                <option value="no">No stairs support</option>
                <option value="yes">Stairs OK</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Stairs surcharge (AUD)</span>
              <Input name="stairsExtraDollars" type="number" step="1" defaultValue="0" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Helper support</span>
              <select
                name="helperAvailable"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
                defaultValue="no"
              >
                <option value="no">No helper</option>
                <option value="yes">Helper available</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Helper surcharge (AUD)</span>
              <Input name="helperExtraDollars" type="number" step="1" defaultValue="0" />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Publish state</span>
            <select
              name="status"
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
              defaultValue="active"
            >
              <option value="active">Publish now</option>
              <option value="draft">Save as draft</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Special handling notes</span>
              <span className="text-xs text-text-secondary">{specialNotes.length}/280</span>
            </div>
            <Textarea
              name="specialNotes"
              value={specialNotes}
              maxLength={280}
              onChange={(event) => setSpecialNotes(event.target.value)}
              placeholder="Special handling notes"
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        {stepIndex < steps.length - 1 ? (
          <Button
            type="button"
            onClick={() => setStepIndex((value) => Math.min(steps.length - 1, value + 1))}
          >
            Next
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save trip"}
          </Button>
        )}
      </div>
    </form>
  );
}
