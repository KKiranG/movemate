import Link from "next/link";

import { ResolveDisputeActions } from "@/components/admin/resolve-dispute-actions";
import { requirePageAdminUser } from "@/lib/auth";
import { listAdminDisputes } from "@/lib/data/admin";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getSeverity(category: string) {
  if (category === "damage" || category === "wrong_item") {
    return {
      label: "High",
      className: "border-error/30 bg-error/10 text-error",
      rank: 0,
    };
  }

  if (category === "late" || category === "no_show" || category === "overcharge") {
    return {
      label: "Medium",
      className: "border-warning/30 bg-warning/10 text-warning",
      rank: 1,
    };
  }

  return {
    label: "Low",
    className: "border-border bg-black/[0.03] text-text-secondary dark:bg-white/[0.04]",
    rank: 2,
  };
}

export default async function AdminDisputesPage() {
  await requirePageAdminUser();
  const disputes = await listAdminDisputes();
  const now = Date.now();
  const triagedDisputes = [...disputes].sort((left, right) => {
    const leftSeverity = getSeverity(left.category).rank;
    const rightSeverity = getSeverity(right.category).rank;

    if (leftSeverity !== rightSeverity) {
      return leftSeverity - rightSeverity;
    }

    const leftAge = now - new Date(left.created_at).getTime();
    const rightAge = now - new Date(right.created_at).getTime();
    return rightAge - leftAge;
  });
  const urgentCount = triagedDisputes.filter((dispute) => {
    const ageMs = now - new Date(dispute.created_at).getTime();
    return ageMs > 48 * 60 * 60 * 1000 || getSeverity(dispute.category).rank === 0;
  }).length;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin disputes"
        title="Keep disputes lightweight and evidence-based"
        description="The MVP dispute flow is intentionally simple: intake form, proof photos, admin notes, resolution."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="section-label">Urgent</p>
          <p className="mt-2 text-3xl text-text">{urgentCount}</p>
          <p className="mt-2 text-sm text-text-secondary">High-priority or aged over 48 hours.</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">High severity</p>
          <p className="mt-2 text-3xl text-text">
            {triagedDisputes.filter((dispute) => getSeverity(dispute.category).rank === 0).length}
          </p>
          <p className="mt-2 text-sm text-text-secondary">Damage and wrong-item claims.</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Open queue</p>
          <p className="mt-2 text-3xl text-text">{triagedDisputes.length}</p>
          <p className="mt-2 text-sm text-text-secondary">All disputes awaiting admin action.</p>
        </Card>
      </div>

      <div className="grid gap-4">
        {triagedDisputes.map((dispute) => {
          const severity = getSeverity(dispute.category);
          const ageMs = now - new Date(dispute.created_at).getTime();
          const ageHours = Math.max(0, Math.round(ageMs / (1000 * 60 * 60)));
          const isStale = ageMs > 48 * 60 * 60 * 1000;

          return (
          <Card key={dispute.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="section-label">{dispute.category}</p>
                  <Badge className={severity.className}>{severity.label} priority</Badge>
                  {isStale ? (
                  <Badge className="border-error/30 bg-error/10 text-error">Aged &gt; 48h</Badge>
                  ) : null}
                </div>
                <h2 className="mt-2 text-lg text-text">{dispute.status}</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Owner {dispute.assigned_admin_user_id ?? "Unassigned"} · Age {ageHours}h
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-text-secondary">
                  Booking{" "}
                  {(dispute.booking as { booking_reference?: string } | null)?.booking_reference ?? dispute.booking_id}
                </span>
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
          );
        })}
        {disputes.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">No disputes right now.</p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
