import { notFound } from "next/navigation";

import { PrivateProofTile } from "@/components/booking/private-proof-tile";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { requirePageAdminUser } from "@/lib/auth";
import { getAdminDisputeById } from "@/lib/data/admin";

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requirePageAdminUser();
  const dispute = await getAdminDisputeById(params.id);

  if (!dispute) {
    notFound();
  }

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
