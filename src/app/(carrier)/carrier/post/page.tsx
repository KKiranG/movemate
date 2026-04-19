import { redirect } from "next/navigation";

export default function CarrierPostLegacyRoute() {
  redirect("/carrier/trips/new");
}
