import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrivateProofTile } from "@/components/booking/private-proof-tile";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { requirePageAdminUser } from "@/lib/auth";
import { getAdminDisputeById } from "@/lib/data/admin";
import { listConditionAdjustmentsForAdmin } from "@/lib/data/condition-adjustments";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getConditionAdjustmentReasonLabel } from "@/lib/validation/condition-adjustment";

export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const dispute = await getAdminDisputeById(params.id);

  if (!dispute) {
    return { title: "Dispute not found" };
  }

  return {
    title: `Dispute ${dispute.booking_id} | Admin`,
  };
}

export default async function AdminDisputeDetailPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  await requirePageAdminUser();
  const dispute = await getAdminDisputeById(params.id);

  if (!dispute) {
    notFound();
  }

  const adjustments = await listConditionAdjustmentsForAdmin({
    bookingId: dispute.booking_id,
    limit: 5,
  });

  const bookingReference =
    (dispute.booking as { booking_reference?: string } | null)?.booking_reference ??
    dispute.booking_id;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Dispute evidence"
        title={`Dispute ${bookingReference}`}
        description="Review visual evidence without opening raw storage URLs one by one."
      />

      <Card className="p-4">
        <div className="space-y-2">
          <p className="section-label">Summary</p>
          <p className="text-sm text-text">Category: {dispute.category}</p>
          <p className="text-sm text-text">Raised by: {dispute.raised_by}</p>
          <p className="text-sm text-text-secondary">{dispute.description}</p>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Booking context</p>
            <h2 className="mt-1 text-lg text-text">Proof, timeline, and payment state</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">Booking status</p>
              <p className="mt-1 text-sm text-text-secondary">
                {(dispute.booking as { status?: string } | null)?.status ?? "Unavailable"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">Payment state</p>
              <p className="mt-1 text-sm text-text-secondary">
                {(dispute.booking as { payment_status?: string } | null)?.payment_status ?? "Unavailable"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">Proof packs</p>
              <p className="mt-1 text-sm text-text-secondary">
                {(dispute.booking as {
                  pickup_proof_photo_url?: string | null;
                  delivery_proof_photo_url?: string | null;
                } | null)?.pickup_proof_photo_url
                  ? "Pickup proof on file"
                  : "Pickup proof missing"}
                {" · "}
                {(dispute.booking as {
                  pickup_proof_photo_url?: string | null;
                  delivery_proof_photo_url?: string | null;
                } | null)?.delivery_proof_photo_url
                  ? "Delivery proof on file"
                  : "Delivery proof missing"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">Delivery timeline</p>
              <p className="mt-1 text-sm text-text-secondary">
                Delivered{" "}
                {(dispute.booking as { delivered_at?: string | null } | null)?.delivered_at
                  ? new Date(
                      (dispute.booking as { delivered_at?: string | null }).delivered_at as string,
                    ).toLocaleString("en-AU")
                  : "not recorded"}
                {" · "}
                Customer confirmation{" "}
                {(dispute.booking as { customer_confirmed_at?: string | null } | null)?.customer_confirmed_at
                  ? "recorded"
                  : "not recorded"}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium text-text">Recent timeline events</p>
            <div className="mt-2 grid gap-2">
              {((dispute.events as Array<{ event_type?: string; created_at?: string }> | null) ?? [])
                .slice(0, 6)
                .map((event, index) => (
                  <div key={`${event.event_type ?? "event"}:${index}`} className="rounded-xl border border-border bg-black/[0.02] px-3 py-2 text-sm text-text-secondary dark:bg-white/[0.04]">
                    <span className="text-text">{event.event_type ?? "Event"}</span>
                    <span> · {event.created_at ? new Date(event.created_at).toLocaleString("en-AU") : "time unavailable"}</span>
                  </div>
                ))}
              {(((dispute.events as Array<{ event_type?: string; created_at?: string }> | null) ?? []).length === 0) ? (
                <p className="text-sm text-text-secondary">No booking timeline events were attached to this dispute record.</p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Condition adjustment trail</p>
            <h2 className="mt-1 text-lg text-text">Misdescription history tied to this booking</h2>
          </div>
          <div className="grid gap-3">
            {adjustments.map((adjustment) => (
              <div key={adjustment.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-text">
                  {getConditionAdjustmentReasonLabel(adjustment.reasonCode)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {formatCurrency(adjustment.amountCents)} · {adjustment.status.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Raised {formatDateTime(adjustment.createdAt)}
                </p>
                {adjustment.note ? (
                  <p className="mt-2 text-sm text-text-secondary">{adjustment.note}</p>
                ) : null}
                {adjustment.customerResponseNote ? (
                  <p className="mt-2 text-sm text-text-secondary">
                    Customer note: {adjustment.customerResponseNote}
                  </p>
                ) : null}
              </div>
            ))}
            {adjustments.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No condition adjustments were recorded against this booking.
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Evidence gallery</p>
            <h2 className="mt-1 text-lg text-text">Photos and supporting uploads</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(dispute.photo_urls ?? []).map((path: string, index: number) => (
              <PrivateProofTile
                key={path}
                bucket={PRIVATE_BUCKETS.proofPhotos}
                path={path}
                title={`Evidence ${index + 1}`}
                subtitle={`Uploaded by ${dispute.raised_by}`}
              />
            ))}
            {(dispute.photo_urls ?? []).length === 0 ? (
              <p className="subtle-text">No evidence files were uploaded for this dispute.</p>
            ) : null}
          </div>
        </div>
      </Card>
    </main>
  );
}
