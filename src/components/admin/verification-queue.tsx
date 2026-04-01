"use client";

import { useEffect, useMemo, useState } from "react";

import { VerifyCarrierActions } from "@/components/admin/verify-carrier-actions";
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

function ReviewNotes({
  carrierId,
  initialValue,
  onChange,
}: {
  carrierId: string;
  initialValue?: string | null;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue ?? "");

  useEffect(() => {
    const storedValue = window.localStorage.getItem(
      `${NOTE_STORAGE_KEY_PREFIX}:${carrierId}`,
    );

    if (storedValue !== null) {
      setValue(storedValue);
      onChange(storedValue);
      return;
    }

    onChange(initialValue ?? "");
  }, [carrierId, initialValue, onChange]);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    window.localStorage.setItem(`${NOTE_STORAGE_KEY_PREFIX}:${carrierId}`, nextValue);
    onChange(nextValue);
  }

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
        className="min-h-24 rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      />
      <p className="text-xs text-text-secondary">
        Saved locally in this browser for MVP review continuity.
      </p>
    </label>
  );
}

function QueueCard({ carrier }: { carrier: CarrierProfile }) {
  const [notes, setNotes] = useState(carrier.verificationNotes ?? "");

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

  return (
    <Card className="p-4">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-label">Carrier review</p>
              <h2 className="mt-1 text-lg text-text">{carrier.businessName}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {carrier.contactName} · {carrier.phone}
              </p>
              <p className="text-sm text-text-secondary">{carrier.email}</p>
            </div>
            <div className="rounded-xl border border-accent/15 bg-accent/10 px-3 py-2 text-sm font-medium capitalize text-accent">
              {carrier.verificationStatus}
            </div>
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
              <p className="mt-2 text-sm text-text">
                Licence {carrier.licenceExpiryDate ?? "not set"} · Insurance {carrier.insuranceExpiryDate ?? "not set"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ReviewNotes
            carrierId={carrier.id}
            initialValue={carrier.verificationNotes}
            onChange={setNotes}
          />
          <VerifyCarrierActions carrier={carrier} notes={notes} />
        </div>
      </div>
    </Card>
  );
}

export function VerificationQueue({ carriers }: { carriers: CarrierProfile[] }) {
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

        return (
          new Date(right.verificationSubmittedAt ?? right.verifiedAt ?? 0).getTime() -
          new Date(left.verificationSubmittedAt ?? left.verifiedAt ?? 0).getTime()
        );
      }),
    [carriers],
  );

  const needsReviewCount = sortedCarriers.filter(
    (carrier) =>
      carrier.verificationStatus === "submitted" || carrier.verificationStatus === "pending",
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="section-label">Needs review</p>
          <p className="mt-2 text-3xl text-text">{needsReviewCount}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Verified</p>
          <p className="mt-2 text-3xl text-text">
            {sortedCarriers.filter((carrier) => carrier.verificationStatus === "verified").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Rejected</p>
          <p className="mt-2 text-3xl text-text">
            {sortedCarriers.filter((carrier) => carrier.verificationStatus === "rejected").length}
          </p>
        </Card>
      </div>

      <div className="grid gap-4">
        {sortedCarriers.map((carrier) => (
          <QueueCard key={carrier.id} carrier={carrier} />
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
