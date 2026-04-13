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
import type { RoutePriceGuidance, TripDraftVehicleOption } from "@/types/trip";
import { getTripConflictWarnings, getTripPublishReadiness } from "@/lib/validation/trip";

const steps = ["Route", "When & space", "Price & rules"] as const;
const weekdayOptions = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;
const acceptOptions = [
  { value: "furniture", label: "Furniture" },
  { value: "boxes", label: "Boxes" },
  { value: "appliance", label: "Appliance" },
  { value: "fragile", label: "Fragile" },
] as const;

const itemPresets = [
  { id: "mattress", label: "Mattress", accepts: ["furniture"], suggestedSpaceSize: "M" },
  { id: "fridge", label: "Fridge", accepts: ["appliance"], suggestedSpaceSize: "L" },
  { id: "sofa", label: "Sofa", accepts: ["furniture"], suggestedSpaceSize: "L" },
  { id: "washing-machine", label: "Washing machine", accepts: ["appliance"], suggestedSpaceSize: "M" },
  { id: "marketplace-pickup", label: "Marketplace pickup", accepts: ["furniture", "boxes"], suggestedSpaceSize: "S" },
  { id: "boxes", label: "Boxes", accepts: ["boxes"], suggestedSpaceSize: "S" },
  { id: "office-overflow", label: "Office overflow", accepts: ["boxes", "fragile"], suggestedSpaceSize: "M" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  accepts: Array<(typeof acceptOptions)[number]["value"]>;
  suggestedSpaceSize: "S" | "M" | "L" | "XL";
}>;

function getDistanceKm(origin: AddressValue | null, destination: AddressValue | null) {
  if (!origin || !destination) {
    return 35;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLng = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return Math.max(1, Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

export function CarrierTripWizard({
  initialOrigin = null,
  initialDestination = null,
  initialSpaceSize = "M",
  initialPriceDollars,
  initialDetourRadiusKm,
  initialTripDate,
  initialTimeWindow = "flexible",
  initialAvailableVolumeM3,
  initialAvailableWeightKg,
  initialAccepts = ["furniture", "boxes", "appliance"],
  initialSpecialNotes = "",
  initialIsReturnTrip = false,
  initialStairsOk = false,
  initialStairsExtraDollars = "0",
  initialHelperAvailable = false,
  initialHelperExtraDollars = "0",
  initialVehicleId,
  vehicles = [],
  canPost = true,
  onboardingHref = "/carrier/onboarding",
}: {
  initialOrigin?: AddressValue | null;
  initialDestination?: AddressValue | null;
  initialSpaceSize?: "S" | "M" | "L" | "XL";
  initialPriceDollars?: string;
  initialDetourRadiusKm?: string;
  initialTripDate?: string;
  initialTimeWindow?: "morning" | "afternoon" | "evening" | "flexible";
  initialAvailableVolumeM3?: string;
  initialAvailableWeightKg?: string;
  initialAccepts?: Array<"furniture" | "boxes" | "appliance" | "fragile">;
  initialSpecialNotes?: string;
  initialIsReturnTrip?: boolean;
  initialStairsOk?: boolean;
  initialStairsExtraDollars?: string;
  initialHelperAvailable?: boolean;
  initialHelperExtraDollars?: string;
  initialVehicleId?: string;
  vehicles?: TripDraftVehicleOption[];
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
  const [accepts, setAccepts] = useState<string[]>(initialAccepts);
  const [specialNotes, setSpecialNotes] = useState(initialSpecialNotes);
  const [detourRadiusKm, setDetourRadiusKm] = useState(initialDetourRadiusKm ?? "5");
  const [detourToleranceLabel, setDetourToleranceLabel] = useState<"tight" | "standard" | "flexible">("standard");
  const [waypointOne, setWaypointOne] = useState("");
  const [waypointTwo, setWaypointTwo] = useState("");
  const [isReturnTrip, setIsReturnTrip] = useState(initialIsReturnTrip);
  const [tripDate, setTripDate] = useState(initialTripDate ?? getTodayIsoDate());
  const [timeWindow, setTimeWindow] = useState<"morning" | "afternoon" | "evening" | "flexible">(
    initialTimeWindow,
  );
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [availableVolumeM3, setAvailableVolumeM3] = useState(initialAvailableVolumeM3 ?? "1");
  const [availableWeightKg, setAvailableWeightKg] = useState(initialAvailableWeightKg ?? "100");
  const [stairsOk, setStairsOk] = useState(initialStairsOk);
  const [stairsExtraDollars, setStairsExtraDollars] = useState(initialStairsExtraDollars);
  const [helperAvailable, setHelperAvailable] = useState(initialHelperAvailable);
  const [helperExtraDollars, setHelperExtraDollars] = useState(initialHelperExtraDollars);
  const [publishState, setPublishState] = useState<"draft" | "active">("active");
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    initialVehicleId ?? vehicles[0]?.id ?? "",
  );
  const [priceGuidance, setPriceGuidance] = useState<RoutePriceGuidance | null>(null);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [hasEditedPrice, setHasEditedPrice] = useState(Boolean(initialPriceDollars));
  const guidanceAbortRef = useRef<AbortController | null>(null);
  const guidanceTimerRef = useRef<number | null>(null);
  const routeDistanceKm = useMemo(
    () => getDistanceKm(origin, destination),
    [destination, origin],
  );

  const pricingSuggestion = useMemo(
    () =>
      suggestPrice({
        distanceKm: routeDistanceKm,
        spaceSize,
        needsStairs: false,
        needsHelper: false,
        isReturn: isReturnTrip,
      }),
    [isReturnTrip, routeDistanceKm, spaceSize],
  );
  const [priceDollars, setPriceDollars] = useState(
    initialPriceDollars ?? Math.round(pricingSuggestion.midCents / 100).toString(),
  );
  const publishIssues = useMemo(
    () =>
      getTripPublishReadiness({
        status: publishState,
        spaceSize,
        availableVolumeM3: Number(availableVolumeM3) || 0,
        availableWeightKg: Number(availableWeightKg) || 0,
        accepts: accepts as Array<"furniture" | "boxes" | "appliance" | "fragile" | "other">,
        timeWindow,
        specialNotes,
        helperAvailable,
        stairsOk,
      }),
    [
      accepts,
      availableVolumeM3,
      availableWeightKg,
      helperAvailable,
      publishState,
      spaceSize,
      specialNotes,
      stairsOk,
      timeWindow,
    ],
  );
  const blockingPublishIssues = publishIssues.filter((issue) => issue.severity === "blocking");
  const warningPublishIssues = publishIssues.filter((issue) => issue.severity === "warning");
  const conflictWarnings = useMemo(
    () =>
      getTripConflictWarnings({
        spaceSize,
        accepts: accepts as Array<"furniture" | "boxes" | "appliance" | "fragile" | "other">,
        specialNotes,
        helperAvailable,
        stairsOk,
      }),
    [accepts, helperAvailable, spaceSize, specialNotes, stairsOk],
  );

  useEffect(() => {
    if (!selectedVehicleId && vehicles[0]?.id) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    if (hasEditedPrice || initialPriceDollars) {
      return;
    }

    setPriceDollars(
      Math.round((priceGuidance?.medianCents ?? pricingSuggestion.midCents) / 100).toString(),
    );
  }, [hasEditedPrice, initialPriceDollars, priceGuidance?.medianCents, pricingSuggestion.midCents]);

  function validateCurrentStep(index: number) {
    if (index === 0) {
      if (!canPost) {
        setError("Add an active vehicle in onboarding before posting a trip.");
        return false;
      }

      if (vehicles.length > 1 && !selectedVehicleId) {
        setError("Choose which active vehicle should carry this trip before continuing.");
        return false;
      }

      if (!origin?.suburb || !origin.postcode || !destination?.suburb || !destination.postcode) {
        setError("Choose origin and destination from the address suggestions.");
        return false;
      }
    }

    if (index === 1) {
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

      if (publishState === "active" && blockingPublishIssues.length > 0) {
        setError("Resolve the publish blockers below or save this route as a draft.");
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

  function handleStepChange(targetIndex: number) {
    if (targetIndex <= stepIndex) {
      setError(null);
      setStepIndex(targetIndex);
      return;
    }

    for (let index = stepIndex; index < targetIndex; index += 1) {
      if (!validateCurrentStep(index)) {
        return;
      }
    }

    setError(null);
    setStepIndex(targetIndex);
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
          originLat: String(origin.latitude),
          originLng: String(origin.longitude),
          destinationLat: String(destination.latitude),
          destinationLng: String(destination.longitude),
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
  }, [
    destination?.latitude,
    destination?.longitude,
    destination?.suburb,
    origin?.latitude,
    origin?.longitude,
    origin?.suburb,
    spaceSize,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (stepIndex !== steps.length - 1) {
      handleNext();
      return;
    }

    if (!origin || !destination) {
      setError("Choose origin and destination from the address suggestions.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (publishState === "active" && blockingPublishIssues.length > 0) {
        throw new Error("Resolve the publish blockers below or save this route as a draft.");
      }

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicleId || undefined,
          originSuburb: origin.suburb,
          originPostcode: origin.postcode,
          originLatitude: origin.latitude,
          originLongitude: origin.longitude,
          destinationSuburb: destination.suburb,
          destinationPostcode: destination.postcode,
          destinationLatitude: destination.latitude,
          destinationLongitude: destination.longitude,
          waypointSuburbs: [waypointOne.trim(), waypointTwo.trim()].filter(Boolean),
          routePolyline: [origin.latitude, origin.longitude, destination.latitude, destination.longitude].join(","),
          recurrenceRule: recurrenceRule.trim() || undefined,
          recurrenceDays,
          detourToleranceLabel,
          detourRadiusKm: Number(detourRadiusKm),
          tripDate,
          timeWindow,
          spaceSize,
          availableVolumeM3: Number(availableVolumeM3),
          availableWeightKg: Number(availableWeightKg),
          priceCents: Math.round(Number(priceDollars) * 100),
          suggestedPriceCents: priceGuidance?.medianCents ?? pricingSuggestion.midCents,
          accepts,
          stairsOk,
          stairsExtraCents: Math.round(Number(stairsExtraDollars || 0) * 100),
          helperAvailable,
          helperExtraCents: Math.round(Number(helperExtraDollars || 0) * 100),
          isReturnTrip,
          status: publishState,
          specialNotes,
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

  function applyItemPreset(preset: (typeof itemPresets)[number]) {
    setAccepts(Array.from(new Set(preset.accepts)));
    setSpaceSize((current) => {
      const order = ["S", "M", "L", "XL"] as const;
      const currentIndex = order.indexOf(current);
      const presetIndex = order.indexOf(preset.suggestedSpaceSize);
      return presetIndex > currentIndex ? preset.suggestedSpaceSize : current;
    });
  }

  return (
    <form
      className="grid gap-4 pb-28"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          stepIndex < steps.length - 1 &&
          event.target instanceof HTMLInputElement &&
          event.target.type === "number"
        ) {
          event.preventDefault();
        }
      }}
    >
      <div className="flex gap-2 overflow-x-auto">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => handleStepChange(index)}
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
          {vehicles.length > 0 ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-text">Vehicle</span>
                <span className="text-xs text-text-secondary">
                  {vehicles.length === 1
                    ? "Posting will use your current active vehicle"
                    : "Choose which active vehicle is taking this corridor"}
                </span>
              </div>
              {vehicles.length === 1 ? (
                <div className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-text">{vehicles[0]?.label}</p>
                  <p className="mt-1 text-sm text-text-secondary">{vehicles[0]?.detail}</p>
                </div>
              ) : (
                <select
                  name="vehicleId"
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  className="min-h-[44px] rounded-xl border border-border bg-surface px-3 text-sm text-text"
                >
                  <option value="">Choose a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.label} · {vehicle.detail}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-text">Optional waypoint 1</span>
                <Input
                  value={waypointOne}
                  onChange={(event) => setWaypointOne(event.target.value)}
                  placeholder="E.g. Alexandria"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-text">Optional waypoint 2</span>
                <Input
                  value={waypointTwo}
                  onChange={(event) => setWaypointTwo(event.target.value)}
                  placeholder="E.g. Newtown"
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Detour radius</span>
              <span className="text-xs text-text-secondary">
                Controls how far pickups can sit off your route
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "tight", label: "Tight", tone: "Best for direct lanes and strict fit." },
                { value: "standard", label: "Standard", tone: "Balanced corridor matching." },
                { value: "flexible", label: "Flexible", tone: "Allows wider off-route pickups." },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDetourToleranceLabel(option.value as "tight" | "standard" | "flexible")}
                  className={`min-h-[44px] rounded-xl border px-3 py-3 text-left text-sm ${
                    detourToleranceLabel === option.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                  }`}
                >
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs opacity-80">{option.tone}</span>
                </button>
              ))}
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
            <Input
              name="tripDate"
              type="date"
              min={getTodayIsoDate()}
              value={tripDate}
              onChange={(event) => setTripDate(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Time window</span>
            <select
              name="timeWindow"
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
              value={timeWindow}
              onChange={(event) =>
                setTimeWindow(event.target.value as "morning" | "afternoon" | "evening" | "flexible")
              }
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Repeat this lane weekly</span>
              <span className="text-xs text-text-secondary">Optional for repeat corridors</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {weekdayOptions.map((option) => {
                const selected = recurrenceDays.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setRecurrenceDays((current) =>
                        current.includes(option.value)
                          ? current.filter((day) => day !== option.value)
                          : [...current, option.value],
                      )
                    }
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm ${
                      selected
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Input
              value={recurrenceRule}
              onChange={(event) => setRecurrenceRule(event.target.value)}
              placeholder="Optional ops note like every school day or fortnightly"
            />
          </div>
          {timeWindow === "flexible" ? (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
              <p className="text-sm font-medium text-warning">Flexible windows need one extra note</p>
              <p className="mt-1 text-sm text-text-secondary">
                Customers look for timing certainty first. A short note like after 2pm or call
                ahead keeps flexible runs trustworthy without turning them into quote requests.
              </p>
            </div>
          ) : null}
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
              value={availableVolumeM3}
              onChange={(event) => setAvailableVolumeM3(event.target.value)}
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
              value={availableWeightKg}
              onChange={(event) => setAvailableWeightKg(event.target.value)}
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
            {/* Future post-MVP extension: return/backload listings may allow one customer counter up to 20% below ask,
                followed by one final carrier response, with no contact detail exposure and no open-ended bidding. */}
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
              Built for founder-led price guidance, not a black-box market estimate. Start here, then adjust for access, handling, and route certainty.
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              Based on an estimated {routeDistanceKm}km between your resolved origin and destination.
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              {priceGuidance?.usedFallback
                ? "Using the Sydney fallback guide until we have at least 5 route examples."
                : `Built from ${priceGuidance?.exampleCount ?? 0} moverrr examples on a similar corridor.`}
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              blockingPublishIssues.length > 0
                ? "border-warning/20 bg-warning/10"
                : "border-border bg-black/[0.02] dark:bg-white/[0.04]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="section-label">Publish readiness</p>
                <h3 className="mt-1 text-lg text-text">
                  {blockingPublishIssues.length > 0
                    ? "Fix these before the route goes live"
                    : "This route is ready to publish"}
                </h3>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                {blockingPublishIssues.length} blockers · {warningPublishIssues.length} quality nudges
              </span>
            </div>
            {publishIssues.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {publishIssues.map((issue) => (
                  <div
                    key={issue.code}
                    className={`rounded-xl border px-3 py-3 text-sm ${
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
            ) : (
              <p className="mt-3 text-sm text-text-secondary">
                Route, capacity, rules, and accepted item types are aligned well enough for matching.
              </p>
            )}
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Price in dollars</span>
            <Input
              name="priceDollars"
              type="number"
              step="1"
              value={priceDollars}
              onChange={(event) => {
                setHasEditedPrice(true);
                setPriceDollars(event.target.value);
              }}
              placeholder="Price in dollars"
              required
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {itemPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyItemPreset(preset)}
                className="min-h-[44px] rounded-xl border border-border px-3 py-3 text-left text-sm text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
              >
                <span className="block font-medium">{preset.label}</span>
                <span className="block text-xs text-text-secondary">
                  Suggests space {preset.suggestedSpaceSize} and accepted item types
                </span>
              </button>
            ))}
          </div>
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
          {conflictWarnings.length > 0 ? (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-label">Item-fit warnings</p>
                  <h3 className="mt-1 text-lg text-text">Review these before publishing</h3>
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                  Soft warning only
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {conflictWarnings.map((warning) => (
                  <div key={warning.code} className="rounded-xl border border-white/60 bg-white/70 px-3 py-3 text-sm text-text">
                    <p className="font-medium text-text">{warning.message}</p>
                    <p className="mt-1">{warning.hint}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                You can still publish anyway. These warnings are here to keep route fit and access
                boundaries legible before customers book.
              </p>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Stairs support</span>
              <select
                name="stairsOk"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
                value={stairsOk ? "yes" : "no"}
                onChange={(event) => setStairsOk(event.target.value === "yes")}
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
                value={stairsExtraDollars}
                onChange={(event) => setStairsExtraDollars(event.target.value)}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text">Helper support</span>
              <select
                name="helperAvailable"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
                value={helperAvailable ? "yes" : "no"}
                onChange={(event) => setHelperAvailable(event.target.value === "yes")}
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
                value={helperExtraDollars}
                onChange={(event) => setHelperExtraDollars(event.target.value)}
              />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Publish state</span>
            <select
              name="status"
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
              value={publishState}
              onChange={(event) => setPublishState(event.target.value as "draft" | "active")}
            >
              <option value="active">Publish now</option>
              <option value="draft">Save as draft</option>
            </select>
            <p className="text-sm text-text-secondary">
              Quality warnings do not block publishing. Only hard route-fit contradictions force a
              draft-first save.
            </p>
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
