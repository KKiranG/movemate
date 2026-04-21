import { MoveOfferDetailClient } from "@/components/customer/move-offer-detail-client";
import { getOptionalSessionUser } from "@/lib/auth";
import { getCustomerPaymentProfileForUser } from "@/lib/data/customer-payments";

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
