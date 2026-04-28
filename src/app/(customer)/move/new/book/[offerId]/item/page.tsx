import { redirect } from "next/navigation";

type BookItemPageProps = {
  params: Promise<{ offerId: string }>;
  searchParams?: Promise<{ moveRequestId?: string }>;
};

export default async function BookItemPage(props: BookItemPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const moveRequestId = searchParams?.moveRequestId;
  const query = moveRequestId ? `?moveRequestId=${encodeURIComponent(moveRequestId)}` : "";
  redirect(`/move/new/results/${params.offerId}${query}`);
}
