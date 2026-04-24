import { TopAppBar } from "@/components/spec/chrome";
import { ProfileForm } from "@/app/(customer)/account/profile/profile-form";
import { requirePageSessionUser } from "@/lib/auth";
import { getCustomerProfileSummaryForUser } from "@/lib/data/profiles";

function splitName(fullName: string | null | undefined, email: string | null | undefined) {
  const fallback = email?.split("@")[0] ?? "";
  const parts = (fullName ?? fallback).trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export default async function AccountProfilePage() {
  const user = await requirePageSessionUser();
  const profile = await getCustomerProfileSummaryForUser(user.id);
  const { firstName, lastName } = splitName(profile?.full_name, user.email);

  return (
    <main>
      <TopAppBar title="Profile" backHref="/account" />
      <section className="screen space-y-3">
        <ProfileForm initialFirstName={firstName} initialLastName={lastName} />
      </section>
    </main>
  );
}
