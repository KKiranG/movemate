import type { Metadata } from "next";

import { StitchCustomerFlow } from "@/components/customer/stitch-customer-flow";
import { getOptionalSessionUser } from "@/lib/auth";
import { getCustomerPaymentProfileForUser } from "@/lib/data/customer-payments";

export const metadata: Metadata = {
  title: "Declare your move need",
  description: "Tell MoveMate what needs to move and where. We match you with drivers already heading that way, with clear fixed pricing.",
  alternates: { canonical: "/move/new" },
};

export default async function MoveNewIndexPage() {
  const user = await getOptionalSessionUser();
  const paymentProfile = user
    ? await getCustomerPaymentProfileForUser({
        userId: user.id,
      })
    : null;

  return (
    <main>
      <StitchCustomerFlow
        isAuthenticated={Boolean(user)}
        customerPaymentProfile={paymentProfile}
      />
    </main>
  );
}
