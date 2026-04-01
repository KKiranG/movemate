"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  GoogleAutocompleteInput,
  type AddressValue,
} from "@/components/shared/google-autocomplete-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DETOUR_RADIUS_PRESETS,
  SPACE_SIZE_DESCRIPTIONS,
  SPACE_SIZE_LABELS,
  SPECIAL_NOTES_PRESETS,
} from "@/lib/constants";
import { suggestPrice } from "@/lib/pricing/suggest";
import { formatCurrency, getTodayIsoDate } from "@/lib/utils";
import type { RoutePriceGuidance } from "@/types/trip";

const steps = ["Route", "When & space", "Price & rules"] as const;
const acceptOptions = [
  { value: "furniture", label: "Furniture" },
  { value: "boxes", label: "Boxes" },
  { value: "appliance", label: "Appliance" },
  { value: "fragile", label: "Fragile" },
] as const;

export function CarrierTripWizard({
  initialOrigin = null,
  initialDestination = null,
  initialSpaceSize = "M",
  initialPriceDollars,
  initialDetourRadiusKm,
  canPost = true,
  onboardingHref = "/carrier/onboarding",
}: {
  initialOrigin?: AddressValue | null;
  initialDestination?: AddressValue | null;
  initialSpaceSize?: "S" | "M" | "L" | "XL";
  initialPriceDollars?: string;
  initialDetourRadiusKm?: string;
  canPost?: boolean;
  onboardingHref?: string;
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
  const [detourRadiusKm, setDetourRadiusKm] = useState(initialDetourRadiusKm ?? "5");
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [priceGuidance, setPriceGuidance] = useState<RoutePriceGuidance | null>(null);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const guidanceAbortRef = useRef<AbortController | null>(null);
  const guidanceTimerRef = useRef<number | null>(null);

  const pricingSuggestion = useMemo(
    () =>
      suggestPrice({
        distanceKm: 35,
        spaceSize,
        needsStairs: false,
        needsHelper: false,
        isReturn: isReturnTrip,
      }),
    [spaceSize, isReturnTrip],
  );
  const [priceDollars, setPriceDollars] = useState(
    initialPriceDollars ?? Math.round(pricingSuggestion.midCents / 100).toString(),
  );

  function validateCurrentStep(index: number) {
    if (index === 0) {
      if (!canPost) {
        setError("Add an active vehicle in onboarding before posting a trip.");
        return false;
      }

      if (!origin?.suburb || !origin.postcode || !destination?.suburb || !destination.postcode) {
        setError("Choose origin and destination from the address suggestions.");
        return false;
      }
    }

    if (index === 1) {
      const tripDate = String((document.querySelector('input[name="tripDate"]') as HTMLInputElement | null)?.value ?? "");
      const timeWindow = String(
        (document.querySelector('select[name="timeWindow"]') as HTMLSelectElement | null)?.value ?? "",
      );

      if (!tripDate || tripDate < getTodayIsoDate()) {
        setError("Choose a trip date today or later.");
        return false;
      }

      if (!timeWindow) {
        setError("Choose a time window before continuing.");
        return false;
      }
    }

    if (index === 2) {
      if (accepts.length === 0) {
        setError("Select at least one item type you accept.");
        return false;
      }

      if (!Number.isFinite(Number(priceDollars)) || Number(priceDollars) <= 0) {
        setError("Enter a valid price before saving.");
        return false;
      }
    }

    return true;
  }

  function handleBack() {
    setError(null);
    setStepIndex((value) => Math.max(0, value - 1));
  }

  function handleNext() {
    if (!validateCurrentStep(stepIndex)) {
      return;
    }

    setError(null);
    setStepIndex((value) => Math.min(steps.length - 1, value + 1));
  }

  useEffect(() => {
    if (guidanceTimerRef.current) {
      window.clearTimeout(guidanceTimerRef.current);
    }

    guidanceAbortRef.current?.abort();

    if (!origin?.suburb || !destination?.suburb) {
      setPriceGuidance(null);
      setIsGuidanceLoading(false);
      return;
    }

    const controller = new AbortController();
    guidanceAbortRef.current = controller;
    setIsGuidanceLoading(true);

    guidanceTimerRef.current = window.setTimeout(() => {
      void fetch(
        `/api/trips/price-guidance?${new URLSearchParams({
          from: origin.suburb,
          to: destination.suburb,
          spaceSize,
        }).toString()}`,
        {
          signal: controller.signal,
        },
      )
        .then((response) => response.json())
        .then((payload) => {
          if (!controller.signal.aborted) {
            setPriceGuidance(payload.guidance ?? null);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setPriceGuidance(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsGuidanceLoading(false);
          }
        });
    }, 400);

    return () => {
      controller.abort();
      if (guidanceTimerRef.current) {
        window.clearTimeout(guidanceTimerRef.current);
      }
    };
  }, [origin?.suburb, destination?.suburb, spaceSize]);

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
          detourRadiusKm: Number(detourRadiusKm),
          tripDate: formData.get("tripDate"),
          timeWindow: formData.get("timeWindow"),
          spaceSize,
          availableVolumeM3: Number(formData.get("availableVolumeM3")),
          availableWeightKg: Number(formData.get("availableWeightKg")),
          priceCents: Math.round(Number(formData.get("priceDollars")) * 100),
          suggestedPriceCents: priceGuidance?.medianCents ?? pricingSuggestion.midCents,
          accepts,
          stairsOk: formData.get("stairsOk") === "yes",
          stairsExtraCents:
            Math.round(Number(formData.get("stairsExtraDollars") || 0) * 100),
          helperAvailable: formData.get("helperAvailable") === "yes",
          helperExtraCents:
            Math.round(Number(formData.get("helperExtraDollars") || 0) * 100),
          isReturnTrip,
          status: formData.get("status"),
          specialNotes: formData.get("specialNotes"),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create trip.");
      }

      router.push(`/carrier/post?successTripId=${payload.trip.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create trip.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function appendPresetNote(note: string) {
    setSpecialNotes((current) =>
      current.includes(note)
        ? current
        : `${current.trim()}${current.trim() ? " " : ""}${note}`.trim(),
    );
  }

  return (
    <form className="grid gap-4 pb-28" onSubmit={handleSubmit}>
      <div className="flex gap-2 overflow-x-auto">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStepIndex(index)}
            className={`min-h-[44px] min-w-[44px] rounded-xl border px-3 py-2 text-sm transition-colors ${
              index === stepIndex
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-secondary active:bg-black/[0.04] dark:active:bg-white/[0.08]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!canPost ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
          <p className="text-sm font-medium text-warning">Add an active vehicle first</p>
          <p className="mt-1 text-sm text-text-secondary">
            You can review this route setup now, but posting is blocked until onboarding has an active vehicle.
          </p>
          <Button asChild variant="secondary" className="mt-3">
            <a href={onboardingHref}>Go to onboarding</a>
          </Button>
        </div>
      ) : null}

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
          <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 active:bg-black/[0.04] dark:active:bg-white/[0.08]">
            <div>
              <span className="block text-sm font-medium text-text">Return trip / backload</span>
              <span className="text-xs text-text-secondary">
                Highlight this as a lower-cost backload for customers.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isReturnTrip}
              onChange={(event) => setIsReturnTrip(event.target.checked)}
              className="h-4 w-4 accent-accent"
            />
          </label>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Detour radius</span>
              <span className="text-xs text-text-secondary">
                Controls how far pickups can sit off your route
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {DETOUR_RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDetourRadiusKm(String(preset.value))}
                  className={`min-h-[44px] rounded-xl border px-3 py-3 text-left text-sm ${
                    detourRadiusKm === String(preset.value)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                  }`}
                >
                  <span className="block font-medium">{preset.label}</span>
                  <span className="block text-xs opacity-80">{preset.tone}</span>
                </button>
              ))}
            </div>
            <Input
              name="detourRadiusKm"
              type="number"
              step="1"
              value={detourRadiusKm}
              onChange={(event) => setDetourRadiusKm(event.target.value)}
              placeholder="Detour radius km"
              required
            />
            <p className="text-sm text-text-secondary">
              A wider detour radius increases match volume but also adds more route deviation.
            </p>
          </div>
        </div>
      ) : null}

      {stepIndex === 1 ? (
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Trip date</span>
            <Input name="tripDate" type="date" min={getTodayIsoDate()} required />
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
              <option value="S">Small</option>
              <option value="M">Medium</option>
              <option value="L">Large</option>
              <option value="XL">Extra large</option>
            </select>
          </label>
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium text-text">{SPACE_SIZE_LABELS[spaceSize]}</p>
            <p className="mt-1 text-sm text-text-secondary">{SPACE_SIZE_DESCRIPTIONS[spaceSize]}</p>
          </div>
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
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
              <p className="section-label">Price rationale</p>
              <h3 className="mt-1 text-lg text-text">
                {isGuidanceLoading
                  ? "Checking corridor pricing..."
                  : `Similar Sydney jobs: ${formatCurrency(
                      priceGuidance?.lowCents ?? pricingSuggestion.lowCents,
                    )} to ${formatCurrency(priceGuidance?.highCents ?? pricingSuggestion.highCents)}`}
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                {priceGuidance?.explanation ??
                  "Spare-capacity pricing normally sits below dedicated-truck pricing because you are filling space on a route that is already happening."}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                {priceGuidance?.usedFallback
                  ? "Using the Sydney fallback guide until we have at least 5 route examples."
                  : `Built from ${priceGuidance?.exampleCount ?? 0} moverrr examples on a similar corridor.`}
              </p>
            </div>
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
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Special handling notes</span>
              <span className="text-xs text-text-secondary">{specialNotes.length}/280</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_NOTES_PRESETS.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => appendPresetNote(note)}
                  className="min-h-[44px] rounded-full border border-border px-3 py-2 text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                >
                  {note.replace(/\.$/, "")}
                </button>
              ))}
            </div>
            <Textarea
              name="specialNotes"
              value={specialNotes}
              maxLength={280}
              onChange={(event) => setSpecialNotes(event.target.value)}
              placeholder="Special handling notes"
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-content gap-3 pb-[env(safe-area-inset-bottom)]">
          <Button
            type="button"
            variant="secondary"
            disabled={stepIndex === 0}
            className="flex-1"
            onClick={handleBack}
          >
            Back
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button
              type="button"
              className="flex-1"
              onClick={handleNext}
              disabled={!canPost && stepIndex === 0}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting || (!canPost && stepIndex === 0)} className="flex-1">
              {isSubmitting ? "Saving..." : "Save trip"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
