import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Become a carrier",
  description: "Post real trips, review better-fit move requests, and turn repeat Sydney routes into extra earnings.",
};

const steps = [
  "Post a route you are already running.",
  "Set your timing, item rules, and structured pricing.",
  "Review matching requests that fit the trip instead of chasing open-ended quotes.",
];

export default function BecomeCarrierPage() {
  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="For carriers"
        title="Turn spare room on real trips into extra earnings"
        description="moverrr helps Sydney carriers post real trips, then review clear move requests that fit the route, timing, and handling rules they already set."
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-4">
          <h2 className="text-lg text-text">Why carriers use moverrr</h2>
          <ul className="mt-4 grid gap-3 text-sm text-text-secondary">
            <li>Post once and only review requests that suit the trip you were already taking.</li>
            <li>Keep control of route, date, price, and what you will handle.</li>
            <li>Reuse recurring lanes instead of rebuilding the same trip every week.</li>
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="text-lg text-text">How posting works</h2>
          <ol className="mt-4 grid gap-3 text-sm text-text-secondary">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="surface-card flex flex-col gap-4 p-6">
        <h2 className="text-2xl text-text">Ready to post your first trip?</h2>
        <p className="text-base leading-7 text-text-secondary">
          Start with onboarding, add your active vehicle, and publish the next route where you have room to spare.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/carrier/signup"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white active:bg-[#0047b3]"
          >
            Post your first trip
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]"
          >
            See the customer matching flow
          </Link>
        </div>
      </section>
    </main>
  );
}
