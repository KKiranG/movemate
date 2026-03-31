import { requirePageAdminUser } from "@/lib/auth";
import { listAdminCarriers } from "@/lib/data/carriers";
import { VerificationQueue } from "@/components/admin/verification-queue";
import { PageIntro } from "@/components/layout/page-intro";

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
      <VerificationQueue carriers={carriers} />
    </main>
  );
}
