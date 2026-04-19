import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CustomerSignupPage() {
  return (
    <main className="screen flex min-h-screen flex-col justify-center gap-4">
      <p className="eyebrow">MOVERRR</p>
      <h1 className="heading">Create your account</h1>
      <Button className="w-full">Continue with Apple</Button>
      <Button className="w-full" variant="secondary">
        Continue with Google
      </Button>
      <p className="caption text-center">or</p>
      <label className="caption" htmlFor="phone-signup">Phone number</label>
      <input id="phone-signup" className="ios-input" placeholder="+61 4XX XXX XXX" />
      <Button asChild className="w-full" variant="secondary">
        <Link href="/auth/verify">Send code</Link>
      </Button>
      <Link
        href="/auth/login"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-1)] active:bg-[var(--bg-elevated-2)]"
      >
        Already have an account? Log in
      </Link>
    </main>
  );
}
