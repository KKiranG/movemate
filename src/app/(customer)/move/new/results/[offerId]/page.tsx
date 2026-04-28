import type { Metadata } from "next";

import { MoveOfferDetailClient } from "@/components/customer/move-offer-detail-client";
import { getOptionalSessionUser } from "@/lib/auth";
import { getCustomerPaymentProfileForUser } from "@/lib/data/customer-payments";

export async function generateMetadata(
  props: {
    params: Promise<{ offerId: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return {
    title: "Offer details",
    description: "Review pricing, vehicle fit, carrier trust signals, and item constraints before booking.",
    alternates: { canonical: `/move/new/results/${params.offerId}` },
  };
}

export default async function OfferDetailPage(
  props: {
    params: Promise<{
      offerId: string;
    }>;
    searchParams?: Promise<{
      moveRequestId?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
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
