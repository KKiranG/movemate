"use client";

import { useRouter } from "next/navigation";
import {
  BedDouble,
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
import { ITEM_SIZE_DESCRIPTIONS, TIME_WINDOW_LABELS } from "@/lib/constants";
import type { ItemCategory, TimeWindow } from "@/types/trip";

const CATEGORY_OPTIONS = [
  { value: "furniture", label: "Furniture", icon: Sofa },
  { value: "boxes", label: "Boxes", icon: Box },
  { value: "appliance", label: "Appliance", icon: Refrigerator },
  { value: "fragile", label: "Fragile", icon: LampDesk },
  { value: "other", label: "Other", icon: CircleHelp },
  { value: "furniture", label: "Beds", icon: BedDouble },
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
  {
    value: "morning",
    label: "Morning",
    detail: TIME_WINDOW_LABELS.morning,
  },
  {
    value: "afternoon",
    label: "Afternoon",
    detail: TIME_WINDOW_LABELS.afternoon,
  },
  {
    value: "evening",
    label: "Evening",
    detail: TIME_WINDOW_LABELS.evening,
  },
  {
    value: "flexible",
    label: "Flexible",
    detail: "Best chance of finding live spare capacity.",
  },
];

function ToggleGroup({
  title,
  selected,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
  help,
}: {
  title: string;
  selected: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  help: string;
}) {
  return (
    <Card className="p-4">
      <p className="title">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{help}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`min-h-[48px] rounded-[var(--radius-md)] border px-3 text-[13px] font-medium ${
            !selected
              ? "border-[var(--text-primary)] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          }`}
        >
          {noLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`min-h-[48px] rounded-[var(--radius-md)] border px-3 text-[13px] font-medium ${
            selected
              ? "border-[var(--text-primary)] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          }`}
        >
          {yesLabel}
        </button>
      </div>
    </Card>
  );
}

export function MoveIntakeClient({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
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
  const itemReady = Boolean(
    draft.itemDescription.trim() && draft.itemSizeClass && draft.itemWeightBand,
  );
  const canSeeResults = routeReady && itemReady;

  return (
    <section className="screen screen-wide space-y-5">
      <div className="space-y-2">
        <p className="eyebrow">Need first</p>
        <h1 className="heading">Declare the move once, then let live trips compete on fit</h1>
        <p className="body text-[var(--text-secondary)]">
          MoveMate works best when you describe the route, item, timing, and access up front. We
          rank live spare-capacity options after that, instead of making you browse drivers first.
        </p>
      </div>

      <Card className="border-accent/15 bg-accent/5 p-4">
        <p className="section-label">How this flow behaves</p>
        <div className="mt-3 space-y-2 text-sm text-text-secondary">
          <p>1. Tell MoveMate the route, item, timing, and access details once.</p>
          <p>2. See live ranked offers with all-in customer pricing.</p>
          <p>3. Choose Request to Book or Fast Match without leaving the trust boundary.</p>
          <p>
            {isAuthenticated
              ? "You are signed in, so MoveMate can save a real move request when you continue."
              : "You can fill the move here before signing in. MoveMate will ask you to log in before showing exact live matches."}
          </p>
        </div>
      </Card>

      <section id="route" className="space-y-3 scroll-mt-28">
        <div className="space-y-2">
          <p className="section-label">Route</p>
          <h2 className="text-xl text-text">Where are we picking up and dropping off?</h2>
          <p className="text-sm text-text-secondary">
            Start with the real corridor. MoveMate ranks spare-capacity trips after it understands
            the move, not before.
          </p>
        </div>
        <Card className="p-4">
          <div className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Pickup address</span>
              {isHydrated ? (
                <GoogleAutocompleteInput
                  name="pickupAddress"
                  placeholder="Search pickup address"
                  initialResolvedValue={draft.pickup ?? undefined}
                  onResolved={handleResolvedPickup}
                />
              ) : null}
              <span className={`text-xs ${draft.pickup ? "text-success" : "text-text-secondary"}`}>
                {draft.pickup
                  ? `Confirmed: ${draft.pickup.suburb} ${draft.pickup.postcode}`
                  : "Choose a suggested address so the route can be matched properly."}
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Dropoff address</span>
              {isHydrated ? (
                <GoogleAutocompleteInput
                  name="dropoffAddress"
                  placeholder="Search dropoff address"
                  initialResolvedValue={draft.dropoff ?? undefined}
                  onResolved={handleResolvedDropoff}
                />
              ) : null}
              <span className={`text-xs ${draft.dropoff ? "text-success" : "text-text-secondary"}`}>
                {draft.dropoff
                  ? `Confirmed: ${draft.dropoff.suburb} ${draft.dropoff.postcode}`
                  : "Choose a suggested address so MoveMate can rank the live corridor correctly."}
              </span>
            </label>
          </div>
        </Card>
      </section>

      <section id="item" className="space-y-3 scroll-mt-28">
        <div className="space-y-2">
          <p className="section-label">What&apos;s moving</p>
          <h2 className="text-xl text-text">Describe the item clearly enough to filter bad fits out</h2>
          <p className="text-sm text-text-secondary">
            Keep it simple and factual. MoveMate uses this to rank the right live capacity, not to
            start a negotiation thread.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {CATEGORY_OPTIONS.map((category) => {
            const Icon = category.icon;
            const active = draft.itemCategory === category.value;

            return (
              <button
                key={`${category.label}-${category.value}`}
                type="button"
                onClick={() => updateDraft({ itemCategory: category.value })}
                className={`flex min-h-[120px] min-w-[44px] flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border px-3 text-center ${
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

        <Card className="space-y-4 p-4">
          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">What is it?</span>
              <span className="text-xs text-text-secondary">{draft.itemDescription.length}/200</span>
            </div>
            <Textarea
              value={draft.itemDescription}
              maxLength={200}
              onChange={(event) => updateDraft({ itemDescription: event.target.value })}
              placeholder="e.g. 3-seat sofa, queen mattress, 10 moving boxes, Samsung fridge"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Size class</span>
              <select
                className="ios-input"
                value={draft.itemSizeClass}
                onChange={(event) =>
                  updateDraft({
                    itemSizeClass: event.target.value as "" | "S" | "M" | "L" | "XL",
                  })
                }
              >
                <option value="">Choose size</option>
                {Object.entries(ITEM_SIZE_DESCRIPTIONS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Weight band</span>
              <select
                className="ios-input"
                value={draft.itemWeightBand}
                onChange={(event) =>
                  updateDraft({
                    itemWeightBand: event.target.value as
                      | ""
                      | "under_20kg"
                      | "20_to_50kg"
                      | "50_to_100kg"
                      | "over_100kg",
                  })
                }
              >
                <option value="">Choose weight</option>
                <option value="under_20kg">Under 20kg</option>
                <option value="20_to_50kg">20 to 50kg</option>
                <option value="50_to_100kg">50 to 100kg</option>
                <option value="over_100kg">Over 100kg</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Approx dimensions</span>
              <Input
                value={draft.itemDimensions}
                onChange={(event) => updateDraft({ itemDimensions: event.target.value })}
                placeholder="200cm x 90cm x 85cm"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Approx weight if known</span>
              <Input
                type="number"
                min="0"
                max="500"
                step="0.1"
                value={draft.itemWeightKg}
                onChange={(event) => updateDraft({ itemWeightKg: event.target.value })}
                placeholder="Optional kg"
              />
            </label>
          </div>
        </Card>
      </section>

      <section id="timing" className="space-y-3 scroll-mt-28">
        <div className="space-y-2">
          <p className="section-label">When</p>
          <h2 className="text-xl text-text">Set the timing boundary for this move</h2>
          <p className="text-sm text-text-secondary">
            A specific date helps MoveMate rank direct fits. Flexible timing widens the live
            spare-capacity pool.
          </p>
        </div>

        <Card className="p-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Preferred date</span>
            <Input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={draft.preferredDate}
              onChange={(event) => updateDraft({ preferredDate: event.target.value })}
            />
            <span className="text-xs text-text-secondary">
              Leave this blank if the move can go on any nearby date.
            </span>
          </label>
        </Card>

        <div className="space-y-3">
          {TIME_OPTIONS.map((option) => {
            const active = draft.preferredTimeWindow === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateDraft({ preferredTimeWindow: option.value })}
                className={`block w-full rounded-[var(--radius-lg)] border p-4 text-left ${
                  active
                    ? "border-[color:rgba(201,82,28,0.24)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="title">{option.label}</p>
                    <p className="mt-1 caption">{option.detail}</p>
                  </div>
                  <span className="text-[var(--text-tertiary)]">{active ? "Selected" : "→"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="access" className="space-y-3 scroll-mt-28">
        <div className="space-y-2">
          <p className="section-label">Access & handling</p>
          <h2 className="text-xl text-text">Flag the details that prevent bad matches</h2>
          <p className="text-sm text-text-secondary">
            This is where trust-first matching happens. Clear access notes are cheaper than day-of-move surprises.
          </p>
        </div>

        <Card className="p-4">
          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Pickup access notes</span>
              <span className="text-xs text-text-secondary">{draft.pickupAccessNotes.length}/240</span>
            </div>
            <Textarea
              maxLength={240}
              value={draft.pickupAccessNotes}
              onChange={(event) => updateDraft({ pickupAccessNotes: event.target.value })}
              placeholder="Stairs, loading dock, tight parking, long carry, gate code"
            />
          </label>
        </Card>

        <Card className="p-4">
          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Dropoff access notes</span>
              <span className="text-xs text-text-secondary">{draft.dropoffAccessNotes.length}/240</span>
            </div>
            <Textarea
              maxLength={240}
              value={draft.dropoffAccessNotes}
              onChange={(event) => updateDraft({ dropoffAccessNotes: event.target.value })}
              placeholder="Apartment lift, parking challenge, delivery instructions"
            />
          </label>
        </Card>

        <ToggleGroup
          title="Stairs involved?"
          selected={draft.needsStairs}
          onChange={(value) => updateDraft({ needsStairs: value })}
          help="Flag this now so MoveMate can rank only trips that can actually handle the job."
        />

        <ToggleGroup
          title="Need a helper?"
          selected={draft.needsHelper}
          onChange={(value) => updateDraft({ needsHelper: value })}
          help="Use this when the item is bulky, awkward, or not safe for one-person handling."
        />

        <Card className="p-4">
          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Anything else the carrier should know?</span>
              <span className="text-xs text-text-secondary">{draft.specialInstructions.length}/280</span>
            </div>
            <Textarea
              maxLength={280}
              value={draft.specialInstructions}
              onChange={(event) => updateDraft({ specialInstructions: event.target.value })}
              placeholder="Fragile edges, preferred loading side, tighter timing note"
            />
          </label>
        </Card>
      </section>

      <Card className="p-4">
        <p className="section-label">Privacy boundary</p>
        <p className="mt-2 text-sm text-text-secondary">
          Exact street details help MoveMate judge route fit, but carriers only see suburb-level
          matching until a request is accepted.
        </p>
      </Card>

      <div className="sticky-cta">
        <Button
          type="button"
          onClick={() => router.push(getMoveRequestResultsHref(draft.persistedMoveRequestId))}
          disabled={!canSeeResults}
          className="w-full"
        >
          {canSeeResults ? "See live ranked matches" : "Finish route and item details first"}
        </Button>
      </div>
    </section>
  );
}
