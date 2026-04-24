import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CustomerVerifyPage() {
  return (
    <main className="screen flex min-h-screen flex-col justify-center gap-4">
      <p className="eyebrow">MOVEMATE</p>
      <h1 className="heading">Enter the code we sent to</h1>
      <p className="body text-[var(--text-secondary)]">+61 4XX XXX XXX</p>
      <input
        className="ios-input text-center text-xl tracking-[0.2em]"
        defaultValue=""
        placeholder="_ _ _ _ _ _"
        aria-label="Verification code"
      />
      <Button asChild className="w-full">
        <Link href="/">Verify</Link>
      </Button>
      <Button variant="ghost" className="w-full">
        Resend in 30s
      </Button>
    </main>
  );
}
