import type { Metadata } from "next";

import { MoveOfferDetailClient } from "@/components/customer/move-offer-detail-client";
import { getOptionalSessionUser } from "@/lib/auth";
import { getCustomerPaymentProfileForUser } from "@/lib/data/customer-payments";

export async function generateMetadata({
  params,
}: {
  params: { offerId: string };
}): Promise<Metadata> {
  return {
    title: "Offer details",
    description: "Review pricing, vehicle fit, carrier trust signals, and item constraints before booking.",
    alternates: { canonical: `/move/new/results/${params.offerId}` },
  };
}

export default async function OfferDetailPage({
  params,
  searchParams,
}: {
  params: {
    offerId: string;
  };
  searchParams?: {
    moveRequestId?: string;
  };
}) {
  const user = await getOptionalSessionUser();
  const paymentProfile = user
    ? await getCustomerPaymentProfileForUser({
        userId: user.id,
      })
    : null;

  return (
    <MoveOfferDetailClient
      offerId={params.offerId}
      isAuthenticated={Boolean(user)}
      initialMoveRequestId={searchParams?.moveRequestId ?? null}
      customerPaymentProfile={paymentProfile}
    />
  );
}
