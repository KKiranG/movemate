import type { Metadata } from "next";

import { requirePageAdminUser } from "@/lib/auth";
import { listAdminCarriers } from "@/lib/data/carriers";
import { VerificationQueue } from "@/components/admin/verification-queue";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin verification",
};

export default async function AdminVerificationPage() {
  await requirePageAdminUser();
  const carriers = await listAdminCarriers();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin verification"
        title="Review carrier trust signals"
        description="Verification should be fast, manual, and consistent while supply quality matters more than scale."
      />
      <Card className="p-4">
        <p className="section-label">Ops note</p>
        <p className="mt-2 text-sm text-text-secondary">
          Bulk actions are available in the queue below. Document expiry warnings are surfaced
          inline so the riskiest carriers do not get buried.
        </p>
      </Card>
      <VerificationQueue carriers={carriers} />
    </main>
  );
}
