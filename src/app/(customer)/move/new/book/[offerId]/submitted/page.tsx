import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BookSubmittedPage() {
  return (
    <main className="screen flex min-h-screen flex-col justify-center gap-4">
      <p className="text-4xl text-[var(--accent)]">✓</p>
      <h1 className="heading">Request sent to James T.</h1>
      <p className="body text-[var(--text-secondary)]">They&apos;ll reply within 12 hours. We&apos;ll notify you.</p>
      <Button asChild className="w-full">
        <Link href="/bookings/demo-booking">View my request</Link>
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/">Back to home</Link>
      </Button>
      <p className="caption">If this request declines or expires, open Activity to see the next best option.</p>
    </main>
  );
}
