import Link from "next/link";

import { TopAppBar } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";

export default function AccountAdvancedPage() {
  return (
    <main>
      <TopAppBar title="Advanced" backHref="/account" />
      <section className="screen space-y-4">
        <Button asChild className="w-full" variant="secondary">
          <Link href="https://carrier.moverrr.com/">Switch to Carrier view</Link>
        </Button>
        <Button className="w-full" variant="secondary">
          Clear wizard draft
        </Button>
        <Button className="w-full" variant="ghost">
          Data & privacy
        </Button>
      </section>
    </main>
  );
}
