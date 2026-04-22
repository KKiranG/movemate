"use client";

import { useRouter } from "next/navigation";
import {
  Box,
  CircleHelp,
  LampDesk,
  Refrigerator,
  Sofa,
} from "lucide-react";

import { GoogleAutocompleteInput, type AddressValue } from "@/components/shared/google-autocomplete-input";
import { useMoveRequestDraft } from "@/components/customer/use-move-request-draft";
import { getMoveRequestResultsHref } from "@/components/customer/move-request-draft";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TIME_WINDOW_LABELS } from "@/lib/constants";
import type { ItemCategory, TimeWindow } from "@/types/trip";

/*
 * Item category taxonomy — canonical mapping for the intake grid.
 *
 * "furniture" — sofas, tables, beds, desks, wardrobes, chairs, bookshelves.
 *               Beds are furniture. Do NOT add a separate "beds" entry; it
 *               collides with this value and sends ambiguous signal downstream.
 * "boxes"     — moving boxes, tubs, bin bags, student / share-house runs.
 * "appliance" — fridges, washers, dryers, ovens, and other bulky whitegoods.
 * "fragile"   — items requiring extra padding and slower load/unload.
 * "other"     — anything awkward-middle that does not fit the above.
 *
 * Each label maps to exactly one underlying ItemCategory value. No two entries
 * may share a value — duplicate values produce ambiguous matching-engine signal.
 */
const CATEGORY_OPTIONS = [
  { value: "furniture", label: "Furniture", icon: Sofa },
  { value: "boxes", label: "Boxes", icon: Box },
  { value: "appliance", label: "Appliance", icon: Refrigerator },
  { value: "fragile", label: "Fragile", icon: LampDesk },
  { value: "other", label: "Other", icon: CircleHelp },
] satisfies Array<{
  value: ItemCategory;
  label: string;
  icon: typeof Sofa;
}>;

const TIME_OPTIONS: Array<{
  value: TimeWindow;
  label: string;
  detail: string;
}> = [
  { value: "morning", label: "Morning", detail: TIME_WINDOW_LABELS.morning },
  { value: "afternoon", label: "Afternoon", detail: TIME_WINDOW_LABELS.afternoon },
  { value: "evening", label: "Evening", detail: TIME_WINDOW_LABELS.evening },
  { value: "flexible", label: "Flexible", detail: "Any time of day." },
];

export function MoveIntakeClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  void isAuthenticated;
  const router = useRouter();
  const { draft, setDraft, isHydrated } = useMoveRequestDraft();

  function updateDraft(values: Partial<typeof draft>) {
    setDraft({
      ...values,
      persistedMoveRequestId: null,
      persistedFingerprint: null,
    });
  }

  function handleResolvedPickup(value: AddressValue) {
    updateDraft({ pickup: value });
  }

  function handleResolvedDropoff(value: AddressValue) {
    updateDraft({ dropoff: value });
  }

  const routeReady = Boolean(draft.pickup && draft.dropoff);
  const categoryReady = Boolean(draft.itemCategory);
  const canSeeResults = routeReady && categoryReady;

  return (
    <section className="screen screen-wide space-y-5">
      <div className="space-y-1">
        <h1 className="heading">What needs to move?</h1>
        <p className="body text-[var(--text-secondary)]">
          Tell us once. We&apos;ll match you with a driver already going that way.
        </p>
      </div>

      {/* Category */}
      <section className="space-y-3">
        <p className="section-label">What are you moving?</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {CATEGORY_OPTIONS.map((category) => {
            const Icon = category.icon;
            const active = draft.itemCategory === category.value;

            return (
              <button
                key={category.label}
                type="button"
                onClick={() => updateDraft({ itemCategory: category.value })}
                className={`flex min-h-[100px] min-w-[44px] flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border px-3 text-center ${
                  active
                    ? "border-transparent bg-[var(--text-primary)] text-[var(--bg-base)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[12px] font-medium leading-4">{category.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Route */}
      <section className="space-y-3">
        <p className="section-label">Where is it going?</p>
        <Card className="p-4">
          <div className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Pickup</span>
              {isHydrated ? (
                <GoogleAutocompleteInput
                  name="pickupAddress"
                  placeholder="Pickup suburb or address"
                  initialResolvedValue={draft.pickup ?? undefined}
                  onResolved={handleResolvedPickup}
                />
              ) : null}
              {draft.pickup ? (
                <span className="text-xs text-success">
                  {draft.pickup.suburb} {draft.pickup.postcode}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Dropoff</span>
              {isHydrated ? (
                <GoogleAutocompleteInput
                  name="dropoffAddress"
                  placeholder="Dropoff suburb or address"
                  initialResolvedValue={draft.dropoff ?? undefined}
                  onResolved={handleResolvedDropoff}
                />
              ) : null}
              {draft.dropoff ? (
                <span className="text-xs text-success">
                  {draft.dropoff.suburb} {draft.dropoff.postcode}
                </span>
              ) : null}
            </label>
          </div>
        </Card>
      </section>

      {/* Date */}
      <section className="space-y-3">
        <p className="section-label">When?</p>
        <Card className="p-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Preferred date</span>
            <Input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={draft.preferredDate}
              onChange={(event) => updateDraft({ preferredDate: event.target.value })}
            />
            <span className="text-xs text-text-secondary">Leave blank if dates are flexible.</span>
          </label>
        </Card>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIME_OPTIONS.map((option) => {
            const active = draft.preferredTimeWindow === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateDraft({ preferredTimeWindow: option.value })}
                className={`min-h-[64px] rounded-[var(--radius-lg)] border p-3 text-left ${
                  active
                    ? "border-[color:rgba(201,82,28,0.24)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                }`}
              >
                <p className="text-sm font-medium text-text">{option.label}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{option.detail}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Optional note */}
      <section className="space-y-3">
        <p className="section-label">Anything to flag? <span className="normal-case font-normal text-text-secondary">(optional)</span></p>
        <Card className="p-4">
          <label className="flex flex-col gap-2">
            <Textarea
              value={draft.specialInstructions}
              maxLength={280}
              onChange={(event) => updateDraft({ specialInstructions: event.target.value })}
              placeholder="e.g. 3-seat sofa, 2nd floor, lift available"
            />
          </label>
        </Card>
      </section>

      <div className="sticky-cta">
        <Button
          type="button"
          onClick={() => router.push(getMoveRequestResultsHref(draft.persistedMoveRequestId))}
          disabled={!canSeeResults}
          className="w-full"
        >
          {canSeeResults ? "Find drivers" : "Add pickup and dropoff first"}
        </Button>
        <p className="mt-2 text-center text-xs text-text-secondary">
          Nothing is charged until a driver accepts.
        </p>
      </div>
    </section>
  );
}
