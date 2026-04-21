import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The basic terms for booking and posting trips on MoveMate.",
};

export default function TermsPage() {
  return (
    <main id="main-content" className="page-shell">
      <section className="surface-card flex flex-col gap-4 p-6">
        <p className="section-label">Terms of Service</p>
        <h1 className="text-3xl text-text">Marketplace terms for carriers and customers</h1>
        <p className="text-base leading-7 text-text-secondary">
          MoveMate is a need-first marketplace for booking spare room on real
          trips that carriers are already running. Carriers remain responsible
          for the trips they post, and customers remain responsible for accurate
          item, address, and access details.
        </p>
        <p className="text-base leading-7 text-text-secondary">
          Pricing, proof capture, disputes, and refunds are handled according
          to the booking and payment rules shown during checkout and in the
          booking record.
        </p>
      </section>
    </main>
  );
}
