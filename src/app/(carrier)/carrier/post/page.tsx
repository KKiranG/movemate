import { requirePageSessionUser } from "@/lib/auth";
import { CarrierPostPrefill } from "@/components/carrier/carrier-post-prefill";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";

export default async function CarrierPostPage() {
  await requirePageSessionUser();

  return (
    <main className="page-shell">
      <PageIntro
        eyebrow="Post capacity"
        title="Three screens, under 60 seconds"
        description="Route first, then timing and space, then price and rules. This mirrors the master plan exactly."
      />

      <Card className="p-4">
        <CarrierPostPrefill />
      </Card>
    </main>
  );
}
