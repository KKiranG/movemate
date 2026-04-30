"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bed,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Camera,
  CreditCard,
  Dumbbell,
  Edit3,
  Home,
  LampDesk,
  ListChecks,
  Minus,
  PackageCheck,
  Plus,
  Refrigerator,
  Search,
  Settings,
  ShieldCheck,
  Sofa,
  Sparkles,
  Star,
  Table2,
  Truck,
  Tv,
  User,
  WashingMachine,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  stitchAccountRows,
  stitchBookingHistory,
  stitchDriverMatches,
  stitchItems,
  stitchPriceBreakdowns,
  stitchActiveBooking,
  stitchTimelineSteps,
  stitchTimingOptions,
  stitchTimeWindows,
  type StitchAccessPoint,
  type StitchDriverMatch,
  type StitchItem,
  type StitchItemCategory,
  type StitchPriceBreakdown,
} from "@/components/customer/stitch-flow-data";
import {
  createDefaultCustomerFlowAccess,
  createDefaultCustomerFlowRoute,
  createDefaultCustomerFlowTiming,
  getSelectedCustomerFlowItem,
  validateCustomerFlowDraft,
  type CustomerFlowAccessDraft,
  type CustomerFlowRouteDraft,
} from "@/components/customer/stitch-flow-contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

type FlowScreen =
  | "home"
  | "items"
  | "itemDetail"
  | "access"
  | "timing"
  | "matches"
  | "offer"
  | "confirm"
  | "pending"
  | "tracking"
  | "delivered"
  | "declined"
  | "keepLooking"
  | "bookings"
  | "bookingDetail"
  | "receipt"
  | "account";

type AccessState = CustomerFlowAccessDraft;
type RouteState = CustomerFlowRouteDraft;

const itemIconMap: Record<StitchItemCategory, LucideIcon> = {
  sofa: Sofa,
  bed: Bed,
  mattress: Bed,
  fridge: Refrigerator,
  washer: WashingMachine,
  desk: LampDesk,
  dresser: LampDesk,
  table: Table2,
  wardrobe: PackageCheck,
  tv: Tv,
  boxes: Boxes,
  gym: Dumbbell,
  appliance: Refrigerator,
  other: CircleHelp,
};

const flowOrder: FlowScreen[] = [
  "home",
  "items",
  "itemDetail",
  "access",
  "timing",
  "matches",
  "offer",
  "confirm",
  "pending",
  "tracking",
  "delivered",
];

const screenTitles: Partial<Record<FlowScreen, string>> = {
  items: "What's moving?",
  itemDetail: "Item details",
  access: "Access details",
  timing: "When?",
  matches: "Drivers ready",
  offer: "Driver profile",
  confirm: "Confirm request",
  pending: "Finding your driver",
  tracking: "Tracking",
  delivered: "Delivered",
  declined: "Next option",
  keepLooking: "Keep looking",
  bookings: "Bookings",
  bookingDetail: "Move detail",
  receipt: "Receipt",
  account: "Account",
};

const accountSections: Array<{
  title: string;
  rows: typeof stitchAccountRows;
  icon: LucideIcon;
}> = [
  { title: "Profile", rows: stitchAccountRows.slice(0, 2), icon: User },
  { title: "Payments", rows: stitchAccountRows.slice(2, 3), icon: CreditCard },
  { title: "Preferences", rows: stitchAccountRows.slice(3), icon: Bell },
];

const bottomTabs: Array<{
  id: Extract<FlowScreen, "home" | "bookings" | "account">;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "bookings", label: "Moves", icon: ListChecks },
  { id: "account", label: "Account", icon: User },
];

function getSelectedVariant(item: StitchItem) {
  return item.variants.find((variant) => variant.id === item.selectedVariantId) ?? item.variants[0];
}

function getPriceForMatch(match: StitchDriverMatch) {
  return (
    stitchPriceBreakdowns.find((price) => price.id === match.priceBreakdownId) ??
    stitchPriceBreakdowns[0]
  );
}

function Screen({
  children,
  tone = "paper",
}: {
  children: React.ReactNode;
  tone?: "paper" | "deep";
}) {
  return (
    <section
      className={cn(
        "min-h-[calc(100vh-112px)] px-5 pb-28 pt-4",
        tone === "deep" && "bg-[var(--bg-elevated-2)]",
      )}
    >
      {children}
    </section>
  );
}

function FlowNav({
  screen,
  onBack,
  onAccount,
}: {
  screen: FlowScreen;
  onBack: () => void;
  onAccount: () => void;
}) {
  const isHome = screen === "home";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[color:rgba(245,243,238,0.92)] px-4 pb-3 pt-[calc(var(--safe-area-top)+10px)] backdrop-blur-[18px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-12 justify-start">
          {!isHome ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-text">
            {screenTitles[screen] ?? "MoveMate"}
          </p>
        </div>
        <button
          type="button"
          onClick={onAccount}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          aria-label="Open account"
        >
          {isHome ? <User size={18} /> : <Settings size={18} />}
        </button>
      </div>
    </header>
  );
}

function ProgressRail({ screen }: { screen: FlowScreen }) {
  const currentIndex = flowOrder.indexOf(screen);

  if (currentIndex < 0 || screen === "home") {
    return null;
  }

  return (
    <div className="mb-5 flex items-center gap-2" aria-label="Move request progress">
      {flowOrder.slice(1, 7).map((entry, index) => (
        <div
          key={entry}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            index + 1 <= currentIndex ? "bg-[var(--accent)]" : "bg-[var(--bg-elevated-3)]",
          )}
        />
      ))}
    </div>
  );
}

function StickyAction({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="sticky-cta">
      {children}
      {note ? <p className="mt-2 text-center text-xs leading-5 text-text-secondary">{note}</p> : null}
    </div>
  );
}

function TrustChip({
  children,
  tone = "neutral",
  icon: Icon,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "accent" | "warning";
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold leading-4",
        tone === "neutral" && "border-border bg-[var(--bg-elevated-2)] text-text-secondary",
        tone === "success" && "border-transparent bg-[var(--success-subtle)] text-[var(--success)]",
        tone === "accent" && "border-transparent bg-[var(--accent-subtle)] text-[var(--accent)]",
        tone === "warning" && "border-transparent bg-[var(--warning-subtle)] text-[var(--warning)]",
      )}
    >
      {Icon ? <Icon size={13} strokeWidth={2.2} /> : null}
      {children}
    </span>
  );
}

function RouteRail({
  pickup = "Surry Hills",
  dropoff = "Marrickville",
  pickupNote,
  dropoffNote,
}: {
  pickup?: string;
  dropoff?: string;
  pickupNote?: string;
  dropoffNote?: string;
}) {
  return (
    <div className="grid grid-cols-[18px_1fr] gap-x-3">
      <div className="flex flex-col items-center pt-1">
        <div className="h-3 w-3 rounded-full border-2 border-[var(--text-primary)] bg-surface" />
        <div className="my-1 h-10 w-px bg-[color:rgba(19,17,14,0.16)]" />
        <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
      </div>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Pickup</p>
          <p className="mt-1 text-[15px] font-semibold text-text">{pickup}</p>
          {pickupNote ? <p className="mt-1 text-[12px] text-text-secondary">{pickupNote}</p> : null}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Drop-off</p>
          <p className="mt-1 text-[15px] font-semibold text-text">{dropoff}</p>
          {dropoffNote ? <p className="mt-1 text-[12px] text-text-secondary">{dropoffNote}</p> : null}
        </div>
      </div>
    </div>
  );
}

function EditableRouteCard({
  route,
  onPatch,
  compact,
}: {
  route: RouteState;
  onPatch: (patch: Partial<RouteState>) => void;
  compact?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={compact ? "p-4" : "p-4 pb-2"}>
        <div className="grid grid-cols-[18px_1fr] gap-x-3">
          <div className="flex flex-col items-center pt-6">
            <div className="h-3 w-3 rounded-full border-2 border-[var(--text-primary)] bg-surface" />
            <div className="my-1 h-14 w-px bg-[color:rgba(19,17,14,0.16)]" />
            <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Pickup</span>
              <input
                name="pickup"
                aria-label="Pickup"
                placeholder="Pickup suburb or address"
                value={route.pickup}
                onChange={(event) => onPatch({ pickup: event.target.value })}
                className="mt-1 min-h-[48px] w-full rounded-[14px] border border-border bg-[var(--bg-elevated-2)] px-3 text-[15px] font-semibold text-text outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">Drop-off</span>
              <input
                name="dropoff"
                aria-label="Drop-off"
                placeholder="Drop-off suburb or address"
                value={route.dropoff}
                onChange={(event) => onPatch({ dropoff: event.target.value })}
                className="mt-1 min-h-[48px] w-full rounded-[14px] border border-border bg-[var(--bg-elevated-2)] px-3 text-[15px] font-semibold text-text outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="border-t border-border bg-[var(--bg-elevated-2)] px-4 py-3">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-text-secondary">
            <Edit3 size={15} />
            Route defines the match. Item and access come next.
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ItemTile({
  item,
  selected,
  onClick,
}: {
  item: StitchItem;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = itemIconMap[item.category] ?? CircleHelp;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[94px] flex-col items-center justify-center gap-2 rounded-[18px] border px-2 text-center transition-all hover:bg-[var(--bg-elevated-2)] active:scale-[0.98] active:bg-[var(--bg-elevated-3)]",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
          : "border-border bg-surface text-text",
      )}
    >
      <Icon size={25} strokeWidth={1.7} />
      <span className="text-[12px] font-semibold leading-4">{item.label}</span>
    </button>
  );
}

function VariantSheet({
  item,
  selectedVariantId,
  quantity,
  onClose,
  onVariant,
  onQuantity,
}: {
  item: StitchItem | null;
  selectedVariantId: string;
  quantity: number;
  onClose: () => void;
  onVariant: (variantId: string) => void;
  onQuantity: (quantity: number) => void;
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[color:rgba(19,17,14,0.34)] px-3 pb-0">
      <div className="mx-auto w-full max-w-[430px] rounded-t-[28px] border border-border bg-[var(--bg-base)] p-5 shadow-[0_-18px_52px_rgba(19,17,14,0.20)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Item details</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-text">{item.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-surface hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
            aria-label="Close item detail"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {item.variants.map((variant) => {
            const active = variant.id === selectedVariantId;

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onVariant(variant.id)}
                className={cn(
                  "flex min-h-[68px] w-full items-start justify-between gap-3 rounded-[16px] border p-3 text-left hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
                  active ? "border-[var(--text-primary)] bg-surface" : "border-border bg-transparent",
                )}
              >
                <span>
                  <span className="block text-[14px] font-semibold text-text">{variant.label}</span>
                  <span className="mt-1 block text-[12px] leading-4 text-text-secondary">{variant.notes}</span>
                </span>
                {active ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--accent)]" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-[16px] border border-border bg-surface p-3">
          <span className="text-[14px] font-semibold text-text">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onQuantity(Math.max(1, quantity - 1))}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--bg-elevated-2)] hover:bg-[var(--bg-elevated-3)] active:scale-[0.96]"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-6 text-center text-[18px] font-semibold tabular">{quantity}</span>
            <button
              type="button"
              onClick={() => onQuantity(quantity + 1)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.96] active:opacity-80"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <Button type="button" onClick={onClose} className="mt-5 w-full">
          Add to move
        </Button>
      </div>
    </div>
  );
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-[44px] rounded-[14px] border px-2 text-[13px] font-semibold hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
              active
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-base)]"
                : "border-border bg-transparent text-text",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function AccessCard({
  title,
  point,
  destination,
  onPatch,
}: {
  title: string;
  point: StitchAccessPoint;
  destination?: boolean;
  onPatch: (patch: Partial<StitchAccessPoint>) => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            destination ? "bg-[var(--accent)]" : "border-2 border-[var(--text-primary)] bg-surface",
          )}
        />
        <div>
          <p className="section-label">{title}</p>
          <p className="mt-1 text-[14px] font-semibold text-text">{point.addressLabel}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-text-secondary">Flights of stairs</p>
          <SegmentedControl
            value={point.stairs}
            onChange={(stairs) => onPatch({ stairs })}
            options={[
              { value: 0, label: "0" },
              { value: 1, label: "1" },
              { value: 2, label: "2" },
            ]}
          />
        </div>
        <div className="flex min-h-[54px] items-center justify-between border-t border-border pt-3">
          <div>
            <p className="text-[14px] font-semibold text-text">Lift available</p>
            <p className="text-[12px] text-text-secondary">Used for fit and safe handling.</p>
          </div>
          <Toggle checked={point.liftAvailable} onChange={() => onPatch({ liftAvailable: !point.liftAvailable })} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-text-secondary">Parking</p>
          <SegmentedControl
            value={point.parking}
            onChange={(parking) => onPatch({ parking })}
            options={[
              { value: "easy", label: "Easy" },
              { value: "moderate", label: "Unsure" },
              { value: "tight", label: "Tight" },
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative h-8 min-h-8 w-[54px] min-w-[54px] rounded-full transition-colors active:scale-[0.98]",
        checked ? "bg-[var(--text-primary)]" : "bg-[var(--bg-elevated-3)]",
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "absolute top-1 h-6 w-6 rounded-full bg-surface shadow-sm transition-transform",
          checked ? "translate-x-[25px]" : "translate-x-1",
        )}
      />
    </button>
  );
}

function DriverCard({
  match,
  featured,
  onDetails,
  onRequest,
}: {
  match: StitchDriverMatch;
  featured?: boolean;
  onDetails: () => void;
  onRequest: () => void;
}) {
  const price = getPriceForMatch(match);

  return (
    <Card className={cn("overflow-hidden", featured && "border-[var(--accent)]")}>
      {featured ? (
        <div className="flex items-center gap-2 bg-[var(--accent)] px-4 py-3 text-[var(--text-on-accent)]">
          <Sparkles size={15} />
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Best match</p>
        </div>
      ) : null}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={match.driverName} featured={featured} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-text">{match.driverName}</h3>
              <BadgeCheck size={16} className="text-[var(--success)]" />
            </div>
            <p className="mt-1 text-[12.5px] leading-4 text-text-secondary">
              {match.vehicleLabel} · {match.routeLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[24px] font-semibold leading-none tracking-[-0.03em] tabular text-text">
              {formatCurrency(price.totalCents)}
            </p>
            <p className="mt-1 text-[11.5px] text-text-secondary">all in</p>
          </div>
        </div>

        <div className="mt-4 rounded-[14px] bg-[var(--bg-elevated-2)] p-3">
          <p className="text-[13px] font-semibold text-text">{match.accentLabel}</p>
          <p className="mt-1 text-[12px] leading-4 text-text-secondary">
            Already travelling this corridor in your selected window.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.trustSignals.map((signal, index) => (
            <TrustChip key={signal} tone={index === 0 ? "success" : "neutral"} icon={index === 0 ? ShieldCheck : undefined}>
              {signal}
            </TrustChip>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1.45fr] border-t border-border">
        <button
          type="button"
          onClick={onDetails}
          className="flex min-h-[52px] items-center justify-center gap-2 border-r border-border text-[13px] font-semibold text-text hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
        >
          Details
        </button>
        <button
          type="button"
          onClick={onRequest}
          className="flex min-h-[52px] items-center justify-center gap-2 bg-[var(--text-primary)] text-[13px] font-semibold text-[var(--bg-base)] hover:opacity-90 active:opacity-80"
        >
          Request {match.driverName.split(" ")[0]} <ArrowRight size={15} />
        </button>
      </div>
    </Card>
  );
}

function Avatar({ name, featured }: { name: string; featured?: boolean }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-[14px] font-bold",
        featured
          ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
          : "bg-[var(--bg-elevated-2)] text-text",
      )}
    >
      {initials}
    </div>
  );
}

function CountdownBadge({ match }: { match: StitchDriverMatch }) {
  return (
    <div className="mx-auto mb-5 grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(var(--accent)_0_72%,var(--bg-elevated-3)_72%_100%)] p-2">
      <div className="grid h-full w-full place-items-center rounded-full bg-[var(--bg-elevated-2)] text-center">
        <div>
          <Avatar name={match.driverName} featured />
          <p className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-text tabular">01:42</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary">response window</p>
        </div>
      </div>
    </div>
  );
}

function PriceBreakdown({ price }: { price: StitchPriceBreakdown }) {
  return (
    <Card className="p-4">
      <p className="section-label">All-in price</p>
      <div className="mt-3 space-y-2">
        {price.lines.map((line) => (
          <div key={line.id} className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="text-text-secondary">{line.label}</span>
            <span className="font-semibold tabular text-text">{formatCurrency(line.amountCents)}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 text-[14px]">
          <span className="text-text-secondary">Platform commission</span>
          <span className="font-semibold tabular text-text">{formatCurrency(price.platformCommissionCents)}</span>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px] font-semibold text-text">Total</span>
          <span className="text-[26px] font-semibold tracking-[-0.03em] tabular text-text">
            {formatCurrency(price.totalCents)}
          </span>
        </div>
        <p className="mt-2 text-[12.5px] leading-5 text-text-secondary">
          Payment is authorised when you request. It is captured only when the carrier accepts.
        </p>
      </div>
    </Card>
  );
}

function Timeline({ mode = "request" }: { mode?: "request" | "tracking" | "delivered" }) {
  const steps =
    mode === "tracking"
      ? [
          ["Accepted", "Complete", "Friday 8:14pm"],
          ["On the way to pickup", "Complete", "9:58am"],
          ["Item loaded", "Complete", "10:24am"],
          ["Heading to drop-off", "Current", "now"],
          ["Delivered", "Upcoming", "~10:42am"],
        ]
      : mode === "delivered"
        ? [
            ["Accepted", "Complete", "Friday 8:14pm"],
            ["Item loaded", "Complete", "10:24am"],
            ["Delivered with proof", "Complete", "10:41am"],
            ["Receipt confirmed", "Current", "next"],
          ]
        : stitchTimelineSteps.map((step) => [step.label, step.status, step.timestampLabel]);

  return (
    <Card className="p-4">
      <p className="section-label">Status</p>
      <div className="mt-2 divide-y divide-border">
        {steps.map(([label, status, time]) => {
          const complete = String(status).toLowerCase() === "complete";
          const current = String(status).toLowerCase() === "current";

          return (
            <div key={`${label}-${time}`} className="grid grid-cols-[24px_1fr_auto] gap-3 py-3">
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border",
                  complete && "border-transparent bg-[var(--text-primary)] text-[var(--bg-base)]",
                  current && "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]",
                  !complete && !current && "border-border bg-transparent",
                )}
              >
                {complete ? <Check size={12} strokeWidth={3} /> : current ? <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> : null}
              </div>
              <div>
                <p className={cn("text-[13.5px] font-semibold", !complete && !current ? "text-text-secondary" : "text-text")}>
                  {label}
                </p>
              </div>
              <p className="text-right text-[11.5px] text-text-secondary tabular">{time}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function StitchCustomerFlow() {
  const [screen, setScreen] = useState<FlowScreen>("home");
  const [route, setRoute] = useState<RouteState>(() => createDefaultCustomerFlowRoute());
  const [selectedItemId, setSelectedItemId] = useState(stitchItems[0]?.id ?? "");
  const [itemState, setItemState] = useState(() =>
    Object.fromEntries(
      stitchItems.map((item) => [
        item.id,
        { selectedVariantId: item.selectedVariantId, quantity: item.quantity },
      ]),
    ) as Record<string, { selectedVariantId: string; quantity: number }>,
  );
  const [sheetItemId, setSheetItemId] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessState>(() => createDefaultCustomerFlowAccess());
  const defaultTiming = createDefaultCustomerFlowTiming();
  const [selectedTimingId, setSelectedTimingId] = useState(defaultTiming.dateOptionId);
  const [selectedWindowId, setSelectedWindowId] = useState(defaultTiming.windowOptionId);
  const [selectedMatchId, setSelectedMatchId] = useState(stitchDriverMatches[0]?.id ?? "");
  const [photoAdded, setPhotoAdded] = useState(false);
  const [openDays, setOpenDays] = useState(true);
  const [openWindow, setOpenWindow] = useState(false);

  const selectedItem = useMemo(
    () => stitchItems.find((item) => item.id === selectedItemId) ?? stitchItems[0],
    [selectedItemId],
  );
  const selectedItemDraft = selectedItem ? itemState[selectedItem.id] : undefined;
  const selectedVariant =
    selectedItem && selectedItemDraft
      ? selectedItem.variants.find((variant) => variant.id === selectedItemDraft.selectedVariantId) ?? getSelectedVariant(selectedItem)
      : undefined;
  const selectedFlowItem =
    selectedItem && selectedItemDraft
      ? getSelectedCustomerFlowItem({
          itemId: selectedItem.id,
          variantId: selectedItemDraft.selectedVariantId,
          quantity: selectedItemDraft.quantity,
          photoAttached: photoAdded,
        })
      : null;
  const sheetItem = stitchItems.find((item) => item.id === sheetItemId) ?? null;
  const sheetState = sheetItem ? itemState[sheetItem.id] : undefined;
  const selectedMatch = stitchDriverMatches.find((match) => match.id === selectedMatchId) ?? stitchDriverMatches[0];
  const selectedPrice = selectedMatch ? getPriceForMatch(selectedMatch) : stitchPriceBreakdowns[0];
  const draftValidation = selectedFlowItem
    ? validateCustomerFlowDraft({
        route,
        selectedItem: selectedFlowItem,
        access,
        timing: {
          dateOptionId: selectedTimingId,
          windowOptionId: selectedWindowId,
          openNearbyDays: openDays,
          openAnyWindow: openWindow,
        },
      })
    : { ok: false, errors: ["Select an item."] };

  function goto(next: FlowScreen) {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    const index = flowOrder.indexOf(screen);
    if (screen === "bookings" || screen === "account") {
      goto("home");
      return;
    }
    if (screen === "bookingDetail" || screen === "receipt") {
      goto("bookings");
      return;
    }
    if (index > 0) {
      goto(flowOrder[index - 1]);
      return;
    }
    goto("home");
  }

  function patchItem(itemId: string, patch: Partial<{ selectedVariantId: string; quantity: number }>) {
    setItemState((previous) => ({
      ...previous,
      [itemId]: {
        ...previous[itemId],
        ...patch,
      },
    }));
  }

  const commonNav = <FlowNav screen={screen} onBack={goBack} onAccount={() => goto("account")} />;

  return (
    <>
      {commonNav}
      {screen !== "bookings" && screen !== "account" ? <ProgressRail screen={screen} /> : null}

      {screen === "home" ? (
        <Screen>
          <div className="mb-6">
            <p className="section-label">MoveMate</p>
            <h1 className="mt-2 [font-family:var(--font-display)] text-[44px] leading-[0.98] tracking-[-0.035em] text-text">
              Get a mate for
              <br />
              your move.
            </h1>
            <p className="mt-4 max-w-[310px] text-[15px] leading-6 text-text-secondary">
              Tell us the route and item once. We show ranked drivers already heading the right way.
            </p>
          </div>

          <div className="mb-5">
            <EditableRouteCard route={route} onPatch={(patch) => setRoute((previous) => ({ ...previous, ...patch }))} />
            <button
              type="button"
              onClick={() => goto("items")}
              className="mt-3 flex min-h-[56px] w-full items-center justify-between rounded-[18px] bg-[var(--text-primary)] px-4 text-left text-[var(--bg-base)] hover:opacity-95 active:opacity-85"
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold">
                <PackageCheck size={18} />
                Select items
              </span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="mb-5">
            <p className="mb-3 text-[12px] font-semibold text-text-secondary">Popular bulky moves</p>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {stitchItems.slice(0, 7).map((item) => {
                const Icon = itemIconMap[item.category] ?? CircleHelp;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      goto("itemDetail");
                    }}
                    className="flex min-h-[86px] min-w-[76px] shrink-0 flex-col items-center justify-center gap-2 rounded-[20px] border border-border bg-surface px-3 hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                  >
                    <Icon size={25} />
                    <span className="text-[12px] font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--accent-subtle)] text-[var(--accent)]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-text">Structured and fixed-price</h2>
                <p className="mt-1 text-[13px] leading-5 text-text-secondary">
                  Prices are fixed before you request. Drivers decide from the full job details.
                </p>
              </div>
            </div>
          </Card>

          <StickyAction note="Nothing is charged until a driver accepts your request.">
            <Button type="button" onClick={() => goto("items")} className="w-full">
              Start move request
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "items" ? (
        <Screen>
          <div className="mb-5">
            <h1 className="[font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              What needs moving?
            </h1>
            <p className="mt-2 text-[14px] leading-5 text-text-secondary">
              Pick the closest item. You can tune type and quantity before matching.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {stitchItems.map((item) => (
              <ItemTile
                key={item.id}
                item={item}
                selected={item.id === selectedItemId}
                onClick={() => {
                  setSelectedItemId(item.id);
                  setSheetItemId(item.id);
                }}
              />
            ))}
          </div>

          <Card className="mt-5 p-4">
            <p className="section-label">Selected</p>
            <div className="mt-3 flex items-center gap-3">
              {selectedItem ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--bg-elevated-2)]">
                    {(() => {
                      const Icon = itemIconMap[selectedItem.category] ?? CircleHelp;
                      return <Icon size={25} />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-text">{selectedItem.label}</p>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      {selectedVariant?.label} · Qty {selectedItemDraft?.quantity ?? 1}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </Card>

          <StickyAction>
            <Button type="button" onClick={() => goto("itemDetail")} className="w-full">
              Continue
            </Button>
          </StickyAction>

          <VariantSheet
            item={sheetItem}
            selectedVariantId={sheetState?.selectedVariantId ?? ""}
            quantity={sheetState?.quantity ?? 1}
            onClose={() => setSheetItemId(null)}
            onVariant={(selectedVariantId) => sheetItem && patchItem(sheetItem.id, { selectedVariantId })}
            onQuantity={(quantity) => sheetItem && patchItem(sheetItem.id, { quantity })}
          />
        </Screen>
      ) : null}

      {screen === "itemDetail" && selectedItem && selectedVariant ? (
        <Screen>
          <div className="mb-5">
            <p className="section-label">Item summary</p>
            <h1 className="mt-2 [font-family:var(--font-display)] text-[36px] leading-[1.04] tracking-[-0.03em] text-text">
              {selectedItem.label}
              <br />
              is ready.
            </h1>
          </div>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[var(--bg-elevated-2)]">
                {(() => {
                  const Icon = itemIconMap[selectedItem.category] ?? CircleHelp;
                  return <Icon size={28} />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-text">{selectedVariant.label}</p>
                <p className="mt-1 text-[13px] leading-5 text-text-secondary">{selectedVariant.notes}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <TrustChip tone="accent" icon={PackageCheck}>
                    Qty {selectedItemDraft?.quantity ?? 1}
                  </TrustChip>
                  {selectedVariant.helperRecommended ? (
                    <TrustChip tone="warning">Helper recommended</TrustChip>
                  ) : (
                    <TrustChip tone="success" icon={Check}>
                      Easy handling
                    </TrustChip>
                  )}
                </div>
              </div>
            </div>
          </Card>
          <button
            type="button"
            onClick={() => setSheetItemId(selectedItem.id)}
            className="mt-4 flex min-h-[54px] w-full items-center justify-between rounded-[18px] border border-border bg-surface px-4 text-left hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            <span>
              <span className="block text-[14px] font-semibold text-text">Adjust item details</span>
              <span className="mt-0.5 block text-[12px] text-text-secondary">Variant, quantity, and handling hint</span>
            </span>
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
          <Card className="mt-3 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--accent-subtle)] text-[var(--accent)]">
                <Camera size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-text">Add a clear item photo</p>
                <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">
                  Mock prompt for now; later this becomes camera-first upload for fit and proof context.
                </p>
                <button
                  type="button"
                  onClick={() => setPhotoAdded((value) => !value)}
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-[13px] font-semibold text-text hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                >
                  {photoAdded ? <Check size={15} /> : <Camera size={15} />}
                  {photoAdded ? "Photo attached" : "Add mock photo"}
                </button>
              </div>
            </div>
          </Card>
          <StickyAction>
            <Button type="button" onClick={() => goto("access")} className="w-full">
              Next: access details
            </Button>
          </StickyAction>
          <VariantSheet
            item={sheetItem}
            selectedVariantId={sheetState?.selectedVariantId ?? ""}
            quantity={sheetState?.quantity ?? 1}
            onClose={() => setSheetItemId(null)}
            onVariant={(selectedVariantId) => sheetItem && patchItem(sheetItem.id, { selectedVariantId })}
            onQuantity={(quantity) => sheetItem && patchItem(sheetItem.id, { quantity })}
          />
        </Screen>
      ) : null}

      {screen === "access" ? (
        <Screen>
          <div className="mb-5">
            <h1 className="[font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              Any stairs or tricky access?
            </h1>
            <p className="mt-2 text-[14px] leading-5 text-text-secondary">
              These details shape matching and pricing before a driver sees the request.
            </p>
          </div>
          <div className="space-y-3">
            <AccessCard
              title="Pickup"
              point={access.pickup}
              onPatch={(patch) => setAccess((previous) => ({ ...previous, pickup: { ...previous.pickup, ...patch } }))}
            />
            <AccessCard
              title="Drop-off"
              point={access.dropoff}
              destination
              onPatch={(patch) => setAccess((previous) => ({ ...previous, dropoff: { ...previous.dropoff, ...patch } }))}
            />
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-text">Can you help carry?</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">
                    We use this to show drivers who can safely complete the move.
                  </p>
                </div>
                <Toggle
                  checked={access.customerCanHelp}
                  onChange={() => setAccess((previous) => ({ ...previous, customerCanHelp: !previous.customerCanHelp }))}
                />
              </div>
            </Card>
          </div>
          <StickyAction>
            <Button type="button" onClick={() => goto("timing")} className="w-full">
              Next: timing
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "timing" ? (
        <Screen>
          <div className="mb-5">
            <h1 className="[font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              When should it move?
            </h1>
            <p className="mt-2 text-[14px] leading-5 text-text-secondary">
              Choose the best window. Flexibility usually finds stronger route fits.
            </p>
          </div>

          <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {stitchTimingOptions.map((option) => {
              const active = option.id === selectedTimingId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedTimingId(option.id)}
                  className={cn(
                    "min-h-[96px] min-w-[138px] rounded-[20px] border p-3 text-left hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
                    active ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-base)]" : "border-border bg-surface text-text",
                  )}
                >
                  <CalendarDays size={18} />
                  <span className="mt-3 block text-[14px] font-semibold">{option.label}</span>
                  <span className={cn("mt-1 block text-[12px]", active ? "text-[color:rgba(245,243,238,0.74)]" : "text-text-secondary")}>
                    {option.subLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-5">
            <p className="section-label mb-3">Preferred time</p>
            <div className="grid grid-cols-2 gap-2">
              {stitchTimeWindows.map((option) => {
                const active = option.id === selectedWindowId;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedWindowId(option.id)}
                    className={cn(
                      "min-h-[84px] rounded-[18px] border p-3 text-left hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]",
                      active ? "border-[var(--accent)] bg-[var(--accent-subtle)]" : "border-border bg-surface",
                    )}
                  >
                    <span className="block text-[15px] font-semibold text-text">{option.label}</span>
                    <span className="mt-1 block text-[12px] text-text-secondary">{option.window}</span>
                    <span className="mt-2 block text-[11px] font-semibold text-[var(--accent)]">{option.helper}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="p-4">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-[15px] font-semibold text-text">Open to nearby days</p>
                <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">Usually brings more route-compatible drivers.</p>
              </div>
              <Toggle checked={openDays} onChange={() => setOpenDays((value) => !value)} />
            </div>
            <div className="flex items-start justify-between gap-4 pt-4">
              <div>
                <p className="text-[15px] font-semibold text-text">Any time window</p>
                <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">Useful when exact timing matters less than fit.</p>
              </div>
              <Toggle checked={openWindow} onChange={() => setOpenWindow((value) => !value)} />
            </div>
          </Card>
          {!draftValidation.ok ? (
            <Card className="mt-3 border-[var(--warning)]/30 bg-[var(--warning-subtle)] p-4">
              <p className="text-[13px] font-semibold text-[var(--warning)]">Before matching</p>
              <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">
                {draftValidation.errors.join(" ")}
              </p>
            </Card>
          ) : null}

          <StickyAction note="We will show drivers already heading through this corridor.">
            <Button type="button" onClick={() => goto("matches")} className="w-full" disabled={!draftValidation.ok}>
              Find available drivers
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "matches" ? (
        <Screen tone="deep">
          <div className="mb-5">
            <h1 className="[font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              3 drivers ready.
              <br />
              <span className="text-text-secondary">Best fit first.</span>
            </h1>
            <p className="mt-2 text-[13.5px] leading-5 text-text-secondary">
              {route.pickup} to {route.dropoff} · {selectedItem?.label ?? "bulky item"} · access checked.
            </p>
          </div>
          <div className="space-y-3">
            {stitchDriverMatches.map((match, index) => (
              <DriverCard
                key={match.id}
                match={match}
                featured={index === 0}
                onDetails={() => {
                  setSelectedMatchId(match.id);
                  goto("offer");
                }}
                onRequest={() => {
                  setSelectedMatchId(match.id);
                  goto("confirm");
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goto("keepLooking")}
            className="mt-4 flex min-h-[58px] w-full items-center justify-between rounded-[18px] border border-dashed border-[color:rgba(19,17,14,0.20)] px-4 text-left hover:bg-surface active:bg-[var(--bg-elevated-3)]"
          >
            <span>
              <span className="block text-[14px] font-semibold text-text">None of these feel right?</span>
              <span className="mt-1 block text-[12px] text-text-secondary">We can keep looking without charging you.</span>
            </span>
            <ChevronRight size={18} />
          </button>
        </Screen>
      ) : null}

      {screen === "offer" && selectedMatch && selectedPrice ? (
        <Screen>
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={selectedMatch.driverName} featured />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-text">{selectedMatch.driverName}</h1>
                <BadgeCheck size={18} className="text-[var(--success)]" />
              </div>
              <p className="mt-1 text-[13px] text-text-secondary">
                {selectedMatch.vehicleLabel} · {selectedMatch.trustSignals[0]}
              </p>
            </div>
          </div>
          <Card className="mb-3 grid grid-cols-3 divide-x divide-border overflow-hidden">
            {[
              ["Verified", "Vehicle"],
              ["4.9", "Rating"],
              ["< 2 hr", "Replies"],
            ].map(([value, label]) => (
              <div key={label} className="flex min-h-[84px] flex-col items-center justify-center px-2 text-center">
                <Star size={16} className="text-[var(--accent)]" />
                <p className="mt-2 text-[15px] font-semibold tabular text-text">{value}</p>
                <p className="mt-0.5 text-[11px] text-text-secondary">{label}</p>
              </div>
            ))}
          </Card>
          <Card className="mb-3 p-4">
            <p className="section-label">Why this driver fits</p>
            <p className="mt-3 text-[14px] leading-6 text-text">
              {selectedMatch.driverName.split(" ")[0]} is already running a spare-capacity route through your corridor in the selected window. Your item, access, and timing all fit the posted vehicle and handling rules.
            </p>
            <div className="mt-4 border-t border-border pt-4">
              <RouteRail
                pickup={route.pickup}
                pickupNote={`${access.pickup.stairs} flight${access.pickup.stairs === 1 ? "" : "s"} · ${access.pickup.liftAvailable ? "lift available" : "no lift"}`}
                dropoff={route.dropoff}
                dropoffNote={`${access.dropoff.parking} parking · ${access.dropoff.dwellingType}`}
              />
            </div>
          </Card>
          <Card className="mb-3 p-4">
            <p className="section-label">Vehicle</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[var(--bg-elevated-2)]">
                <Truck size={28} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-text">{selectedMatch.vehicleLabel}</p>
                <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">
                  Suitable for {selectedVariant?.label.toLowerCase() ?? "your item"} with proof-backed delivery.
                </p>
              </div>
            </div>
          </Card>
          <PriceBreakdown price={selectedPrice} />
          <StickyAction>
            <Button type="button" onClick={() => goto("confirm")} className="w-full">
              Request {selectedMatch.driverName.split(" ")[0]} · {formatCurrency(selectedPrice.totalCents)}
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "confirm" && selectedMatch && selectedPrice ? (
        <Screen>
          <div className="mb-5">
            <p className="section-label">Request to book</p>
            <h1 className="mt-2 [font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              Confirm the job before {selectedMatch.driverName.split(" ")[0]} sees it.
            </h1>
          </div>
          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedMatch.driverName} featured />
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-text">{selectedMatch.driverName}</p>
                  <p className="mt-1 text-[12.5px] text-text-secondary">{selectedMatch.etaWindow}</p>
                </div>
                <TrustChip tone="success" icon={ShieldCheck}>Verified</TrustChip>
              </div>
            </Card>
            <Card className="p-4">
              <p className="section-label">Move</p>
              <div className="mt-3">
                <RouteRail
                  pickup={route.pickup}
                  pickupNote={`${selectedVariant?.label ?? selectedItem?.label} · pickup access confirmed`}
                  dropoff={route.dropoff}
                  dropoffNote="Drop-off access confirmed"
                />
              </div>
            </Card>
            <PriceBreakdown price={selectedPrice} />
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-1 h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="text-[14px] font-semibold text-text">Authorise, then wait for acceptance</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">
                    We authorise payment now. Capture only happens if the driver accepts within the response window.
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <StickyAction note="If the driver declines or expires, no payment is captured.">
            <Button type="button" onClick={() => goto("pending")} className="w-full">
              Send request
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "pending" && selectedMatch ? (
        <Screen tone="deep">
          <div className="mb-6">
            <CountdownBadge match={selectedMatch} />
            <h1 className="[font-family:var(--font-display)] text-[36px] leading-[1.04] tracking-[-0.03em] text-text">
              Asking {selectedMatch.driverName.split(" ")[0]} first.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-text-secondary">
              They see the route, item, access, and fixed price. If this one declines, you can pick the next option without starting over.
            </p>
          </div>
          <Timeline />
          <Card className="mt-3 p-4">
            <p className="section-label">What happens next</p>
            <div className="mt-3 space-y-3">
              {[
                ["Driver reviews the full job", "Route, item, access, timing, and fixed price are all visible."],
                ["You get a clear accept or decline", "No refreshing and no negotiation loop."],
                ["Next-best option stays ready", "If this expires, the fallback is one tap away."],
              ].map(([title, detail], index) => (
                <div key={title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--text-primary)] text-[11px] font-bold">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-[13.5px] font-semibold text-text">{title}</span>
                    <span className="mt-1 block text-[12.5px] leading-5 text-text-secondary">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={() => goto("declined")} className="w-full">
              Simulate decline
            </Button>
            <Button type="button" onClick={() => goto("tracking")} className="w-full">
              Accepted
            </Button>
          </div>
        </Screen>
      ) : null}

      {screen === "tracking" && selectedMatch ? (
        <Screen tone="deep">
          <div className="mb-5">
            <TrustChip tone="accent">In progress</TrustChip>
            <h1 className="mt-3 [font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              {selectedMatch.driverName.split(" ")[0]} is heading to drop-off.
            </h1>
            <p className="mt-2 text-[13.5px] text-text-secondary">ETA about 18 min · proof required on delivery</p>
          </div>
          <Card className="mb-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={selectedMatch.driverName} featured />
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-text">{selectedMatch.driverName}</p>
                <p className="mt-1 text-[12.5px] text-text-secondary">{selectedMatch.vehicleLabel} · verified vehicle</p>
              </div>
              <Truck size={22} className="text-[var(--accent)]" />
            </div>
          </Card>
          <Timeline mode="tracking" />
          <Card className="mt-3 p-4">
            <div className="flex items-center gap-3">
              <PackageCheck size={23} />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-text">{selectedVariant?.label ?? selectedItem?.label}</p>
                <p className="mt-1 text-[12px] text-text-secondary">{route.pickup} to {route.dropoff}</p>
              </div>
              <TrustChip tone="warning">In transit</TrustChip>
            </div>
          </Card>
          <StickyAction>
            <Button type="button" onClick={() => goto("delivered")} className="w-full">
              View delivery proof
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "delivered" && selectedMatch ? (
        <Screen>
          <div className="mb-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-subtle)] text-[var(--success)]">
              <Check size={26} strokeWidth={3} />
            </div>
            <h1 className="[font-family:var(--font-display)] text-[36px] leading-[1.04] tracking-[-0.03em] text-text">
              Delivered.
              <br />
              <span className="text-text-secondary">Did everything go well?</span>
            </h1>
          </div>
          <div className="mb-3 aspect-[4/3] rounded-[22px] border border-border bg-[repeating-linear-gradient(135deg,var(--bg-elevated-2)_0_10px,var(--bg-elevated-3)_10px_20px)] p-3">
            <div className="flex h-full items-end">
              <span className="rounded-[12px] border border-border bg-surface px-3 py-2 text-[11px] text-text-secondary">
                10:41am · GPS + timestamp verified
              </span>
            </div>
          </div>
          <Card className="mb-3 p-4">
            <p className="text-[15px] font-semibold text-text">How did the move go?</p>
            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--accent-subtle)] active:bg-[var(--bg-elevated-3)]"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star size={28} fill="currentColor" />
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["On time", "Careful", "Friendly", "Clear updates"].map((tag) => (
                <TrustChip key={tag}>{tag}</TrustChip>
              ))}
            </div>
          </Card>
          <Timeline mode="delivered" />
          <StickyAction note="Payout releases after confirmation or the proof-backed auto-release window.">
            <Button type="button" onClick={() => goto("bookings")} className="w-full">
              Confirm receipt
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "declined" ? (
        <Screen>
          <div className="mb-5">
            <TrustChip tone="warning">No payment captured</TrustChip>
            <h1 className="mt-3 [font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              No worries.
              <br />
              Two options left.
            </h1>
            <p className="mt-2 text-[14px] leading-5 text-text-secondary">
              Pick the next-best driver or let MoveMate keep watching the route.
            </p>
          </div>
          <DriverCard
            match={stitchDriverMatches[1] ?? stitchDriverMatches[0]}
            featured
            onDetails={() => {
              setSelectedMatchId((stitchDriverMatches[1] ?? stitchDriverMatches[0]).id);
              goto("offer");
            }}
            onRequest={() => {
              setSelectedMatchId((stitchDriverMatches[1] ?? stitchDriverMatches[0]).id);
              goto("confirm");
            }}
          />
          <button
            type="button"
            onClick={() => goto("keepLooking")}
            className="mt-4 flex min-h-[58px] w-full items-center justify-between rounded-[18px] border border-dashed border-[color:rgba(19,17,14,0.20)] px-4 text-left hover:bg-surface active:bg-[var(--bg-elevated-3)]"
          >
            <span className="text-[14px] font-semibold text-text">Keep looking instead</span>
            <ChevronRight size={18} />
          </button>
        </Screen>
      ) : null}

      {screen === "keepLooking" ? (
        <Screen>
          <div className="mb-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
              <Search size={23} />
            </div>
            <h1 className="[font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              We&apos;ll keep looking for you.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-text-secondary">
              MoveMate watches for carriers heading through your route and notifies you when a fit appears.
            </p>
          </div>
          <Card className="mb-3 p-4">
            <p className="section-label">What happens next</p>
            <div className="mt-3 space-y-3">
              {[
                ["Watch route-compatible drivers", "You stay first in line for a new fit."],
                ["Notify you when ready", "You choose the driver before any request is sent."],
                ["No charge", "Payment is not authorised until you request a driver."],
              ].map(([title, detail], index) => (
                <div key={title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--text-primary)] text-[11px] font-bold">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-text">{title}</span>
                    <span className="mt-1 block text-[12.5px] leading-5 text-text-secondary">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <StickyAction>
            <Button type="button" onClick={() => goto("home")} className="w-full">
              Notify me when someone fits
            </Button>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "bookings" ? (
        <Screen>
          <div className="mb-5 flex items-center justify-between">
            <h1 className="[font-family:var(--font-display)] text-[32px] tracking-[-0.03em] text-text">Bookings</h1>
            <Bell size={21} />
          </div>
          <Card className="mb-5 overflow-hidden">
            <div className="bg-[var(--accent)] px-4 py-3 text-[var(--text-on-accent)]">
              <p className="text-[12px] font-bold uppercase tracking-[0.13em]">{stitchActiveBooking.statusLabel} · {stitchActiveBooking.dateLabel}</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--bg-elevated-2)]">
                  <Sofa size={22} />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-text">{stitchActiveBooking.itemLabel}</p>
                  <p className="mt-1 text-[12.5px] text-text-secondary">{route.pickup} to {route.dropoff}</p>
                </div>
                <p className="font-semibold tabular">{formatCurrency(stitchActiveBooking.totalCents)}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={() => goto("bookingDetail")} className="w-full">
                  Details
                </Button>
                <Button type="button" onClick={() => goto("tracking")} className="w-full">
                  Track
                </Button>
              </div>
            </div>
          </Card>
          <p className="section-label mb-3">Past moves</p>
          <div className="space-y-2">
            {stitchBookingHistory.map((booking) => (
              <Card key={booking.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-text">{booking.moveLabel}</p>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      {booking.driverName} · {booking.dateLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold text-[var(--success)]">{booking.statusLabel}</p>
                    <p className="mt-1 text-[12px] tabular text-text-secondary">{formatCurrency(booking.totalCents)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Screen>
      ) : null}

      {screen === "bookingDetail" ? (
        <Screen>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[var(--bg-elevated-2)]">
              <Sofa size={28} />
            </div>
            <div>
              <h1 className="[font-family:var(--font-display)] text-[28px] leading-[1.04] tracking-[-0.03em] text-text">
                {stitchActiveBooking.itemLabel}
              </h1>
              <p className="mt-1 text-[13px] text-text-secondary">{route.pickup} to {route.dropoff}</p>
            </div>
          </div>
          <div className="space-y-3">
            <Card className="p-4">
              <RouteRail
                pickup={route.pickup}
                pickupNote={`${access.pickup.addressLabel} · ${access.pickup.stairs} flight${access.pickup.stairs === 1 ? "" : "s"}`}
                dropoff={route.dropoff}
                dropoffNote={`${access.dropoff.addressLabel} · ${access.dropoff.parking} parking`}
              />
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={stitchActiveBooking.driverName} featured />
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-text">{stitchActiveBooking.driverName}</p>
                  <p className="mt-1 text-[12.5px] text-text-secondary">{stitchActiveBooking.vehicleLabel} · proof-backed delivery</p>
                </div>
                <TrustChip tone="success">Paid</TrustChip>
              </div>
            </Card>
            <Timeline mode="delivered" />
            <Card className="p-4">
              <p className="section-label">Receipt</p>
              <div className="mt-3 space-y-2">
                {stitchActiveBooking.receiptLines.map((line) => (
                  <div key={line.id} className="flex items-baseline justify-between gap-3 text-[14px]">
                    <span className="text-text-secondary">{line.label}</span>
                    <span className="font-semibold tabular text-text">{formatCurrency(line.amountCents)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-[15px] font-semibold text-text">Total charged</span>
                <span className="text-[22px] font-semibold tabular text-text">{formatCurrency(stitchActiveBooking.totalCents)}</span>
              </div>
            </Card>
          </div>
          <StickyAction>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" onClick={() => goto("receipt")} className="w-full">
                Receipt
              </Button>
              <Button type="button" onClick={() => goto("tracking")} className="w-full">
                Track
              </Button>
            </div>
          </StickyAction>
        </Screen>
      ) : null}

      {screen === "receipt" ? (
        <Screen>
          <div className="mb-5">
            <p className="section-label">Receipt</p>
            <h1 className="mt-2 [font-family:var(--font-display)] text-[34px] leading-[1.04] tracking-[-0.03em] text-text">
              Fixed-price move,
              <br />
              proof confirmed.
            </h1>
          </div>
          <Card className="p-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <PackageCheck size={24} className="text-[var(--accent)]" />
              <div>
                <p className="text-[15px] font-semibold text-text">{stitchActiveBooking.itemLabel}</p>
                <p className="mt-1 text-[12.5px] text-text-secondary">{stitchActiveBooking.dateLabel}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {stitchActiveBooking.receiptLines.map((line) => (
                <div key={line.id} className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="text-text-secondary">{line.label}</span>
                  <span className="font-semibold tabular text-text">{formatCurrency(line.amountCents)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-[15px] font-semibold text-text">Total</span>
              <span className="text-[26px] font-semibold tabular text-text">{formatCurrency(stitchActiveBooking.totalCents)}</span>
            </div>
          </Card>
          <Card className="mt-3 p-4">
            <p className="text-[14px] font-semibold text-text">Need help?</p>
            <p className="mt-1 text-[12.5px] leading-5 text-text-secondary">
              Support stays structured around the booking, proof, and receipt instead of open-ended coordination.
            </p>
          </Card>
        </Screen>
      ) : null}

      {screen === "account" ? (
        <Screen>
          <div className="mb-5">
            <h1 className="[font-family:var(--font-display)] text-[32px] tracking-[-0.03em] text-text">Account</h1>
          </div>
          <Card className="mb-5 p-4">
            <div className="flex items-center gap-3">
              <Avatar name="Avery Chen" featured />
              <div>
                <p className="text-[17px] font-semibold text-text">Avery Chen</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <TrustChip tone="success" icon={Check}>ID verified</TrustChip>
                  <TrustChip>Customer</TrustChip>
                </div>
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            {accountSections.map(({ title, rows, icon: Icon }) => (
              <div key={title}>
                <p className="section-label mb-2">{title}</p>
                <Card className="overflow-hidden">
                  {rows.map((row, index, all) => (
                    <div key={row.id} className={cn("flex items-center gap-3 p-4", index < all.length - 1 && "border-b border-border")}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--bg-elevated-2)]">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-text">{row.label}</p>
                        <p className="mt-1 text-[12px] text-text-secondary">{row.detail}</p>
                      </div>
                      <p className="max-w-[100px] truncate text-right text-[12px] font-semibold text-text-secondary">{row.value}</p>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        </Screen>
      ) : null}

      {["bookings", "account"].includes(screen) ? (
        <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[460px] -translate-x-1/2 items-center justify-around border-t border-border bg-[color:rgba(245,243,238,0.92)] px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-[18px]">
          {bottomTabs.map(({ id, label, icon: Icon }) => {
            const active = screen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goto(id)}
                className={cn(
                  "flex min-h-[50px] min-w-[74px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 text-[11px] font-semibold hover:bg-surface active:bg-[var(--bg-elevated-2)]",
                  active ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-text-secondary",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
