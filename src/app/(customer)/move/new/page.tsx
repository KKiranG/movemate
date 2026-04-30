import type { Metadata } from "next";

import { StitchCustomerFlow } from "@/components/customer/stitch-customer-flow";

export const metadata: Metadata = {
  title: "Declare your move need",
  description: "Tell MoveMate what needs to move and where. We match you with drivers already heading that way, with clear fixed pricing.",
  alternates: { canonical: "/move/new" },
};

export default async function MoveNewIndexPage() {
  return (
    <main>
      <StitchCustomerFlow />
    </main>
  );
}
