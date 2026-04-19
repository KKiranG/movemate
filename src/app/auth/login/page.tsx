import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CustomerLoginPage() {
  return (
    <main className="screen flex min-h-screen flex-col justify-center gap-4">
      <p className="eyebrow">MOVERRR</p>
      <h1 className="heading">Welcome back</h1>
      <Button className="w-full">Continue with Apple</Button>
      <Button className="w-full" variant="secondary">
        Continue with Google
      </Button>
      <p className="caption text-center">or</p>
      <label className="caption" htmlFor="phone-login">Phone number</label>
      <input id="phone-login" className="ios-input" placeholder="+61 4XX XXX XXX" />
      <Button className="w-full" variant="secondary">
        Send code
      </Button>
      <Link
        href="/auth/signup"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-1)] active:bg-[var(--bg-elevated-2)]"
      >
        No account yet? Sign up
      </Link>
    </main>
  );
}
