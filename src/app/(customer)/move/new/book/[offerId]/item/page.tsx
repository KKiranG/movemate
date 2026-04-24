import { redirect } from "next/navigation";

type BookItemPageProps = {
  params: { offerId: string };
  searchParams?: { moveRequestId?: string };
};

export default function BookItemPage({ params, searchParams }: BookItemPageProps) {
  const moveRequestId = searchParams?.moveRequestId;
  const query = moveRequestId ? `?moveRequestId=${encodeURIComponent(moveRequestId)}` : "";
  redirect(`/move/new/results/${params.offerId}${query}`);
}
