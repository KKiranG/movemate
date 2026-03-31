import { SignupForm } from "@/components/auth/signup-form";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/layout/page-intro";
import { ConfigBanner } from "@/components/shared/config-banner";
import { hasSupabaseEnv } from "@/lib/env";

const roles = [
  {
    title: "Customer",
    description: "Browse trips and book into spare capacity.",
  },
  {
    title: "Carrier",
    description: "Post routes and fill otherwise empty space.",
  },
];

export default function SignupPage() {
  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Auth"
        title="Create an account"
        description="Customers can browse without auth, but booking and carrier posting both require an account."
      />

      {!hasSupabaseEnv() ? (
        <ConfigBanner message="Signup requires Supabase environment variables before accounts can be created." />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.title} className="p-4">
            <h2 className="text-lg text-text">{role.title}</h2>
            <p className="mt-2 subtle-text">{role.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">{hasSupabaseEnv() ? <SignupForm /> : null}</Card>
    </main>
  );
}
