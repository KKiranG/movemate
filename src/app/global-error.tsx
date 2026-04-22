"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en-AU">
      <body className="min-h-screen bg-[var(--app-chrome)] antialiased">
        <main id="main-content" className="mx-auto min-h-screen max-w-[460px] page-shell">
          <section className="surface-card flex flex-col gap-4 p-6">
            <p className="section-label">Something went wrong</p>
            <h1 className="text-3xl text-text">We couldn&apos;t finish loading that page.</h1>
            <p className="text-base leading-7 text-text-secondary">
              Try reloading the page. If this keeps happening, head back to your move flow or return home.
            </p>
            <p className="text-sm text-text-secondary">{error.message}</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => reset()}>
                Try again
              </Button>
              <Button asChild type="button" variant="secondary">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
