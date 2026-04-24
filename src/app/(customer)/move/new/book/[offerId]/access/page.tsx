import { redirect } from "next/navigation";

type BookAccessPageProps = {
  params: { offerId: string };
  searchParams?: { moveRequestId?: string };
};

export default function BookAccessPage({ params, searchParams }: BookAccessPageProps) {
  const moveRequestId = searchParams?.moveRequestId;
  const query = moveRequestId ? `?moveRequestId=${encodeURIComponent(moveRequestId)}` : "";
  redirect(`/move/new/results/${params.offerId}${query}`);
}
