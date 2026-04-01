import Link from "next/link";

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
                <p className="mt-1 text-sm text-text-secondary">
                  Owner {dispute.assigned_admin_user_id ?? "Unassigned"} · Age{" "}
                  {Math.max(
                    0,
                    Math.round(
                      (Date.now() - new Date(dispute.created_at).getTime()) /
                        (1000 * 60 * 60),
                    ),
                  )}h
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-text-secondary">
                  Booking {(dispute.booking as { booking_reference?: string } | null)?.booking_reference ?? dispute.booking_id}
                </span>
                {Date.now() - new Date(dispute.created_at).getTime() > 48 * 60 * 60 * 1000 ? (
                  <p className="mt-2 rounded-xl bg-error/10 px-3 py-1 text-xs font-medium text-error">
                    SLA at risk
                  </p>
                ) : null}
              </div>
            </div>
            <p className="mt-3 subtle-text">{dispute.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/admin/disputes/${dispute.id}`} className="text-sm font-medium text-accent">
                Open evidence gallery
              </Link>
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
