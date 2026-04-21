import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Trust and safety",
  description:
    "How MoveMate handles payment holds, verification, proof capture, disputes, and privacy boundaries.",
};

const sections = [
  {
    title: "Payment stays in MoveMate",
    body:
      "Customer payment is held in-platform first. It is not meant to move to cash, PayID, bank transfer, or side-payment extras.",
  },
  {
    title: "Verification is specific, not vague",
    body:
      "Carrier trust signals reflect concrete checks such as submitted business details, document review, payout readiness, and proof-backed job history.",
  },
  {
    title: "Proof capture protects both sides",
    body:
      "Pickup and delivery proof create a time-stamped record before payout release. If the handoff or item condition is wrong, the booking can stay inside MoveMate's dispute flow.",
  },
  {
    title: "Disputes stay evidence-led",
    body:
      "When something goes wrong, MoveMate uses photos, proof records, timestamps, and the booking timeline instead of free-form off-platform arguments.",
  },
  {
    title: "Privacy stays role-bound",
    body:
      "Contact details are for the booked handoff only. Pricing, payment, and disputes should remain in-platform rather than moving into personal channels.",
  },
];

export default function TrustPage() {
  return (
    <main id="main-content" className="page-shell">
      <section className="grid gap-4">
        <div>
          <p className="section-label">Trust & Safety</p>
          <h1 className="mt-1 text-3xl text-text sm:text-4xl">
            Specific protections beat vague promises
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
            MoveMate is built so need-first spare-capacity bookings stay
            understandable: payment stays in-platform, carrier trust signals are
            evidence-led, and proof plus disputes stay tied to the booking
            record.
          </p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <Card key={section.title} className="p-4">
              <h2 className="text-lg text-text">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{section.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
