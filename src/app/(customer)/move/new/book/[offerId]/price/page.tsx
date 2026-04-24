import { redirect } from "next/navigation";

type BookPricePageProps = {
  params: { offerId: string };
  searchParams?: { moveRequestId?: string };
};

export default function BookPricePage({ params, searchParams }: BookPricePageProps) {
  const moveRequestId = searchParams?.moveRequestId;
  const query = moveRequestId ? `?moveRequestId=${encodeURIComponent(moveRequestId)}` : "";
  redirect(`/move/new/results/${params.offerId}${query}`);
}
