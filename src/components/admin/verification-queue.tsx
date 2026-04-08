"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { VerifyCarrierActions } from "@/components/admin/verify-carrier-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DocumentPreviewDialog } from "@/components/ui/dialog";
import type { CarrierProfile } from "@/types/carrier";

const NOTE_STORAGE_KEY_PREFIX = "moverrr-admin-verification-note";

function formatSubmittedAt(value?: string | null) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDaysUntil(date?: string | null) {
  if (!date) {
    return null;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.round((parsed.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function getExpiryTone(daysUntilExpiry: number | null) {
  if (daysUntilExpiry === null) {
    return {
      label: "Not set",
      className: "border-border bg-black/[0.03] text-text-secondary dark:bg-white/[0.04]",
      rank: 2,
    };
  }

  if (daysUntilExpiry < 0) {
    return {
      label: "Expired",
      className: "border-error/30 bg-error/10 text-error",
      rank: 0,
    };
  }

  if (daysUntilExpiry <= 30) {
    return {
      label: `${daysUntilExpiry}d left`,
      className: "border-warning/30 bg-warning/10 text-warning",
      rank: 1,
    };
  }

  return {
    label: `${daysUntilExpiry}d left`,
    className: "border-success/30 bg-success/10 text-success",
    rank: 2,
  };
}

function getQueueAgeHours(submittedAt?: string | null) {
  if (!submittedAt) {
    return null;
  }

  const parsed = new Date(submittedAt);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.max(0, Math.round((Date.now() - parsed.getTime()) / (60 * 60 * 1000)));
}

function getDocumentHealthRank(carrier: CarrierProfile) {
  const licence = getExpiryTone(getDaysUntil(carrier.licenceExpiryDate));
  const insurance = getExpiryTone(getDaysUntil(carrier.insuranceExpiryDate));
  return Math.min(licence.rank, insurance.rank);
}

function ReviewNotes({
  carrierId,
  initialValue,
  onChange,
  disabled,
}: {
  carrierId: string;
  initialValue?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const lastSavedValueRef = useRef(initialValue ?? "");

  useEffect(() => {
    const storedValue = window.localStorage.getItem(`${NOTE_STORAGE_KEY_PREFIX}:${carrierId}`);

    if (storedValue !== null) {
      setValue(storedValue);
      onChange(storedValue);
      lastSavedValueRef.current = initialValue ?? "";
      hydratedRef.current = true;
      return;
    }

    setValue(initialValue ?? "");
    onChange(initialValue ?? "");
    lastSavedValueRef.current = initialValue ?? "";
    hydratedRef.current = true;
  }, [carrierId, initialValue, onChange]);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    window.localStorage.setItem(`${NOTE_STORAGE_KEY_PREFIX}:${carrierId}`, nextValue);
    setSaveState("idle");
    setSaveError(null);
    onChange(nextValue);
  }

  useEffect(() => {
    if (!hydratedRef.current || value === lastSavedValueRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setSaveState("saving");
      setSaveError(null);

      try {
        const response = await fetch(`/api/admin/carriers/${carrierId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationNotes: value.trim() || null,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to save review notes.");
        }

        lastSavedValueRef.current = value;
        setSaveState("saved");
        window.localStorage.removeItem(`${NOTE_STORAGE_KEY_PREFIX}:${carrierId}`);
      } catch (error) {
        setSaveState("error");
        setSaveError(error instanceof Error ? error.message : "Unable to save review notes.");
      }
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [carrierId, value]);

  return (
    <label className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text">Review notes</span>
        <span className="text-xs text-text-secondary">{value.length}/280</span>
      </div>
      <textarea
        value={value}
        maxLength={280}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Ops-only notes for verification calls, missing docs, or follow-up."
        disabled={disabled}
        className="min-h-24 rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      />
      <p className="text-xs text-text-secondary">
        {saveState === "saving"
          ? "Saving to shared admin notes..."
          : saveState === "saved"
            ? "Saved for the whole ops team."
            : saveState === "error"
              ? "Saved locally in this browser until the network is back."
              : "Auto-saves to the shared carrier record after 1 second."}
      </p>
      {saveError ? <p className="text-xs text-error">{saveError}</p> : null}
    </label>
  );
}

function QueueCard({
  carrier,
  selected,
  onToggleSelected,
  notes,
  onNotesChange,
  disabled,
}: {
  carrier: CarrierProfile;
  selected: boolean;
  onToggleSelected: (carrierId: string) => void;
  notes: string;
  onNotesChange: (carrierId: string, value: string) => void;
  disabled?: boolean;
}) {
  const licenceExpiry = getExpiryTone(getDaysUntil(carrier.licenceExpiryDate));
  const insuranceExpiry = getExpiryTone(getDaysUntil(carrier.insuranceExpiryDate));
  const documentHealth = Math.min(licenceExpiry.rank, insuranceExpiry.rank);
  const queueAgeHours = getQueueAgeHours(carrier.verificationSubmittedAt);
  const queueAgeLabel =
    queueAgeHours === null
      ? "Submission time unavailable"
      : queueAgeHours >= 24
        ? `Submitted ${Math.floor(queueAgeHours / 24)}d ago`
        : `Submitted ${queueAgeHours}h ago`;
  const isQueueStale = queueAgeHours !== null && queueAgeHours >= 48;
  const handleNotesChange = useCallback(
    (value: string) => onNotesChange(carrier.id, value),
    [carrier.id, onNotesChange],
  );

  const checks = [
    {
      label: "Licence photo",
      value: carrier.licencePhotoUrl ? "Uploaded" : "Missing",
      ok: Boolean(carrier.licencePhotoUrl),
    },
    {
      label: "Insurance doc",
      value: carrier.insurancePhotoUrl ? "Uploaded" : "Missing",
      ok: Boolean(carrier.insurancePhotoUrl),
    },
    {
      label: "Vehicle photo",
      value: carrier.vehiclePhotoUrl ? "Uploaded" : "Optional, not uploaded",
      ok: Boolean(carrier.vehiclePhotoUrl),
    },
    {
      label: "Service area",
      value:
        carrier.serviceSuburbs.length > 0
          ? carrier.serviceSuburbs.slice(0, 4).join(", ")
          : "No suburbs provided",
      ok: carrier.serviceSuburbs.length > 0,
    },
    {
      label: "Profile",
      value: carrier.bio ? "Business profile filled" : "Bio missing",
      ok: Boolean(carrier.bio),
    },
  ];

  const statusTone =
    carrier.verificationStatus === "submitted" || carrier.verificationStatus === "pending"
      ? "border-warning/20 bg-warning/10 text-warning"
      : carrier.verificationStatus === "verified"
        ? "border-success/20 bg-success/10 text-success"
        : "border-error/20 bg-error/10 text-error";

  return (
    <Card className="p-4">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <label className="mt-1 flex min-h-[44px] min-w-[44px] items-center justify-center">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelected(carrier.id)}
                  disabled={disabled}
                  className="h-5 w-5 rounded border-border text-accent focus-visible:ring-accent/25"
                />
              </label>
              <div>
                <p className="section-label">Carrier review</p>
                <h2 className="mt-1 text-lg text-text">{carrier.businessName}</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {carrier.contactName} · {carrier.phone}
                </p>
                <p className="text-sm text-text-secondary">{carrier.email}</p>
              </div>
            </div>
            <div className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize ${statusTone}`}>
              {carrier.verificationStatus}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                isQueueStale
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-border bg-black/[0.03] text-text-secondary dark:bg-white/[0.04]"
              }
            >
              {queueAgeLabel}
            </Badge>
            {isQueueStale ? (
              <Badge className="border-error/30 bg-error/10 text-error">
                Waiting more than 48h
              </Badge>
            ) : null}
          </div>

          {carrier.bio ? <p className="text-sm text-text">{carrier.bio}</p> : null}

          <div className="grid gap-2 sm:grid-cols-2">
            {checks.map((check) => (
              <div key={check.label} className="rounded-xl border border-border px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                  {check.label}
                </p>
                <p className={`mt-2 text-sm ${check.ok ? "text-text" : "text-error"}`}>
                  {check.value}
                </p>
                {check.label === "Licence photo" && carrier.licencePhotoUrl ? (
                  <div className="mt-2">
                    <DocumentPreviewDialog
                      triggerLabel="View licence"
                      documentUrl={carrier.licencePhotoUrl}
                    />
                  </div>
                ) : null}
                {check.label === "Insurance doc" && carrier.insurancePhotoUrl ? (
                  <div className="mt-2">
                    <DocumentPreviewDialog
                      triggerLabel="View insurance"
                      documentUrl={carrier.insurancePhotoUrl}
                    />
                  </div>
                ) : null}
                {check.label === "Vehicle photo" && carrier.vehiclePhotoUrl ? (
                  <div className="mt-2">
                    <DocumentPreviewDialog
                      triggerLabel="View vehicle"
                      documentUrl={carrier.vehiclePhotoUrl}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border px-3 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                Submitted
              </p>
              <p className="mt-2 text-sm text-text">
                {formatSubmittedAt(carrier.verificationSubmittedAt)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{queueAgeLabel}</p>
            </div>
            <div className="rounded-xl border border-border px-3 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                Existing admin note
              </p>
              <p className="mt-2 text-sm text-text">
                {carrier.verificationNotes?.trim() || "No DB-backed note saved yet."}
              </p>
            </div>
            <div className="rounded-xl border border-border px-3 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                Document expiry
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={licenceExpiry.className}>Licence {licenceExpiry.label}</Badge>
                <Badge className={insuranceExpiry.className}>Insurance {insuranceExpiry.label}</Badge>
                {documentHealth === 0 ? (
                  <Badge className="border-error/30 bg-error/10 text-error">Immediate action</Badge>
                ) : documentHealth === 1 ? (
                  <Badge className="border-warning/30 bg-warning/10 text-warning">
                    Review soon
                  </Badge>
                ) : (
                  <Badge className="border-success/30 bg-success/10 text-success">Healthy</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Licence {carrier.licenceExpiryDate ?? "not set"} · Insurance{" "}
                {carrier.insuranceExpiryDate ?? "not set"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ReviewNotes
            carrierId={carrier.id}
            initialValue={notes}
            onChange={handleNotesChange}
            disabled={disabled}
          />
          <VerifyCarrierActions carrier={carrier} notes={notes} />
        </div>
      </div>
    </Card>
  );
}

export function VerificationQueue({ carriers }: { carriers: CarrierProfile[] }) {
  const router = useRouter();
  const [selectedCarrierIds, setSelectedCarrierIds] = useState<string[]>([]);
  const [notesByCarrierId, setNotesByCarrierId] = useState<Record<string, string>>({});
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const sortedCarriers = useMemo(
    () =>
      [...carriers].sort((left, right) => {
        const leftNeedsReview =
          left.verificationStatus === "submitted" || left.verificationStatus === "pending";
        const rightNeedsReview =
          right.verificationStatus === "submitted" || right.verificationStatus === "pending";

        if (leftNeedsReview !== rightNeedsReview) {
          return leftNeedsReview ? -1 : 1;
        }

        const leftHealth = getDocumentHealthRank(left);
        const rightHealth = getDocumentHealthRank(right);

        if (leftHealth !== rightHealth) {
          return leftHealth - rightHealth;
        }

        return (
          new Date(right.verificationSubmittedAt ?? right.verifiedAt ?? 0).getTime() -
          new Date(left.verificationSubmittedAt ?? left.verifiedAt ?? 0).getTime()
        );
      }),
    [carriers],
  );

  useEffect(() => {
    setNotesByCarrierId(
      Object.fromEntries(
        sortedCarriers.map((carrier) => [carrier.id, carrier.verificationNotes ?? ""]),
      ),
    );
  }, [sortedCarriers]);

  const needsReviewCount = sortedCarriers.filter(
    (carrier) =>
      carrier.verificationStatus === "submitted" || carrier.verificationStatus === "pending",
  ).length;
  const expiringSoonCount = sortedCarriers.filter((carrier) => {
    const documentHealth = getDocumentHealthRank(carrier);
    return documentHealth === 1;
  }).length;
  const expiredCount = sortedCarriers.filter((carrier) => getDocumentHealthRank(carrier) === 0).length;
  const handleNotesChange = useCallback((carrierId: string, value: string) => {
    setNotesByCarrierId((current) => ({ ...current, [carrierId]: value }));
  }, []);

  async function submitBulk(isApproved: boolean) {
    const targets = sortedCarriers.filter((carrier) => selectedCarrierIds.includes(carrier.id));

    if (targets.length === 0) {
      return;
    }

    setBulkError(null);
    setIsBulkSubmitting(true);

    try {
      await Promise.all(
        targets.map(async (carrier) => {
          const response = await fetch(`/api/admin/carriers/${carrier.id}/verify`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isApproved,
              notes: notesByCarrierId[carrier.id] ?? carrier.verificationNotes ?? "",
            }),
          });
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error ?? `Unable to update ${carrier.businessName}.`);
          }
        }),
      );

      setSelectedCarrierIds([]);
      router.refresh();
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "Unable to process bulk verification.");
    } finally {
      setIsBulkSubmitting(false);
    }
  }

  const toggleSelected = useCallback((carrierId: string) => {
    setSelectedCarrierIds((current) =>
      current.includes(carrierId)
        ? current.filter((id) => id !== carrierId)
        : [...current, carrierId],
    );
  }, []);

  const selectAllReviewReady = useCallback(() => {
    setSelectedCarrierIds(
      sortedCarriers
        .filter(
          (carrier) =>
            carrier.verificationStatus === "submitted" || carrier.verificationStatus === "pending",
        )
        .map((carrier) => carrier.id),
    );
  }, [sortedCarriers]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="section-label">Needs review</p>
          <p className="mt-2 text-3xl text-text">{needsReviewCount}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Expiring soon</p>
          <p className="mt-2 text-3xl text-text">{expiringSoonCount}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Expired docs</p>
          <p className="mt-2 text-3xl text-text">{expiredCount}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Verified</p>
          <p className="mt-2 text-3xl text-text">
            {sortedCarriers.filter((carrier) => carrier.verificationStatus === "verified").length}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">Bulk verification</p>
            <p className="mt-1 text-sm text-text-secondary">
              Select carriers to process them in sequence with the existing approval endpoint.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={selectAllReviewReady}
              disabled={isBulkSubmitting}
            >
              Select review-ready
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => submitBulk(true)}
              disabled={isBulkSubmitting || selectedCarrierIds.length === 0}
            >
              {isBulkSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Approve selected
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => submitBulk(false)}
              disabled={isBulkSubmitting || selectedCarrierIds.length === 0}
            >
              Reject selected
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedCarrierIds.length > 0 ? (
            <Badge className="border-accent/20 bg-accent/10 text-accent">
              {selectedCarrierIds.length} selected
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCarrierIds([])}
            disabled={selectedCarrierIds.length === 0 || isBulkSubmitting}
          >
            Clear selection
          </Button>
        </div>
        {bulkError ? <p className="mt-3 text-sm text-error">{bulkError}</p> : null}
      </Card>

      <div className="grid gap-4">
        {sortedCarriers.map((carrier) => (
          <QueueCard
            key={carrier.id}
            carrier={carrier}
            selected={selectedCarrierIds.includes(carrier.id)}
            onToggleSelected={toggleSelected}
            notes={notesByCarrierId[carrier.id] ?? carrier.verificationNotes ?? ""}
            onNotesChange={handleNotesChange}
            disabled={isBulkSubmitting}
          />
        ))}
        {sortedCarriers.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">No carriers are waiting in the verification queue.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
