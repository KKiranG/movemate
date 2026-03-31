import { ResolveDisputeActions } from "@/components/admin/resolve-dispute-actions";
import { requirePageAdminUser } from "@/lib/auth";
import { listAdminDisputes } from "@/lib/data/admin";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";

export default async function AdminDisputesPage() {
  await requirePageAdminUser();
  const disputes = await listAdminDisputes();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin disputes"
        title="Keep disputes lightweight and evidence-based"
        description="The MVP dispute flow is intentionally simple: intake form, proof photos, admin notes, resolution."
      />

      <div className="grid gap-4">
        {disputes.map((dispute) => (
          <Card key={dispute.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">{dispute.category}</p>
                <h2 className="mt-1 text-lg text-text">{dispute.status}</h2>
              </div>
              <span className="text-sm text-text-secondary">Booking {dispute.booking_id}</span>
            </div>
            <p className="mt-3 subtle-text">{dispute.description}</p>
            <div className="mt-4">
              <ResolveDisputeActions disputeId={dispute.id} />
            </div>
          </Card>
        ))}
        {disputes.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">No disputes right now.</p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
