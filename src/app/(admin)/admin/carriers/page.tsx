import { VerificationQueue } from "@/components/admin/verification-queue";
import { requirePageAdminUser } from "@/lib/auth";
import { listAdminCarriers } from "@/lib/data/carriers";
import { PageIntro } from "@/components/layout/page-intro";

export default async function AdminCarriersPage() {
  await requirePageAdminUser();
  const carriers = await listAdminCarriers();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin carriers"
        title="Carrier verification queue"
        description="Approve or reject carriers manually in the MVP while we learn what good supply looks like."
      />
      <VerificationQueue carriers={carriers} />
    </main>
  );
}
