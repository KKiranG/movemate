"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { VerifyCarrierActions } from "@/components/admin/verify-carrier-actions";
import { Button } from "@/components/ui/button";
import type { CarrierProfile } from "@/types/carrier";

const INTERNAL_TAG_OPTIONS = [
  "trusted",
  "probation",
  "flagged",
  "vip",
] as const;

export function CarrierOpsForm({ carrier }: { carrier: CarrierProfile }) {
  const router = useRouter();
  const [verificationNotes, setVerificationNotes] = useState(
    carrier.verificationNotes ?? "",
  );
  const [internalNotes, setInternalNotes] = useState(
    carrier.internalNotes ?? "",
  );
  const [internalTags, setInternalTags] = useState<string[]>(
    carrier.internalTags ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/carriers/${carrier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationNotes: verificationNotes.trim() || null,
          internalNotes: internalNotes.trim() || null,
          internalTags,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save carrier ops notes.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save carrier ops notes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleTag(tag: string) {
    setInternalTags((current) =>
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag],
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">
          Verification notes
        </span>
        <textarea
          value={verificationNotes}
          maxLength={280}
          onChange={(event) => setVerificationNotes(event.target.value)}
          className="min-h-24 rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          placeholder="Visible to ops when approving or rejecting this carrier."
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Internal notes</span>
        <textarea
          value={internalNotes}
          maxLength={1000}
          onChange={(event) => setInternalNotes(event.target.value)}
          className="min-h-28 rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          placeholder="Ops-only context, follow-ups, escalation history, or quality concerns."
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-text">Internal tags</span>
        <div className="flex flex-wrap gap-2">
          {INTERNAL_TAG_OPTIONS.map((tag) => {
            const isActive = internalTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30  items-center rounded-xl border px-3 text-sm font-medium capitalize ${
                  isActive
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save ops fields"}
      </Button>

      <VerifyCarrierActions carrier={carrier} notes={verificationNotes} />
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
