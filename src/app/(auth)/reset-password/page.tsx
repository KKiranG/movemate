import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Send a MoveMate password reset link or finish updating your password.",
};

export default function ResetPasswordPage() {
  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Auth"
        title="Reset your password"
        description="Use your email to get a reset link, or finish choosing a new password after opening the recovery email."
      />

      <Card className="p-4">
        <ResetPasswordForm />
      </Card>
    </main>
  );
}
