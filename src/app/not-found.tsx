import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist on MoveMate.",
};

export default function NotFound() {
  return (
    <main id="main-content" className="page-shell">
      <section className="surface-card flex flex-col gap-4 p-6">
        <p className="section-label">404</p>
        <h1 className="text-3xl text-text">That page doesn&apos;t exist.</h1>
        <p className="text-base leading-7 text-text-secondary">
          The link may be old, the route may have changed, or this page was never part of the live marketplace.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white active:bg-[#0047b3]"
          >
            Start a move request
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
