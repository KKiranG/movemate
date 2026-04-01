import Link from "next/link";

import { TemplateManagementList } from "@/components/carrier/template-management-list";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { listCarrierTemplatesIncludingArchived } from "@/lib/data/templates";

export default async function CarrierTemplatesPage() {
  const user = await requirePageSessionUser();
  const carrier = await getCarrierByUserId(user.id);
  const templates = carrier ? await listCarrierTemplatesIncludingArchived(carrier.id) : [];

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Templates"
        title="Manage your route library"
        description="Rename, duplicate, archive, and clean up templates so quick-post stays useful over time."
        actions={
          <Button asChild variant="secondary">
            <Link href="/carrier/dashboard">Back to dashboard</Link>
          </Button>
        }
      />

      {templates.length > 0 ? (
        <TemplateManagementList templates={templates} />
      ) : (
        <Card className="p-4">
          <p className="subtle-text">No templates yet. Save one from a trip detail page first.</p>
        </Card>
      )}
    </main>
  );
}
