import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MoveMate handles account, booking, and carrier information.",
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="page-shell">
      <section className="surface-card flex flex-col gap-4 p-6">
        <p className="section-label">Privacy Policy</p>
        <h1 className="text-3xl text-text">How MoveMate handles your information</h1>
        <p className="text-base leading-7 text-text-secondary">
          MoveMate collects the details needed to create accounts, post trips,
          take bookings, process payments, and support disputes. We use contact
          details, booking data, and proof uploads to operate need-first
          matching and resolve support issues when they happen.
        </p>
        <p className="text-base leading-7 text-text-secondary">
          We do not sell customer or carrier data. If you need help with your
          data or privacy questions, contact the MoveMate team at
          hello@moverrr.com.au.
        </p>
      </section>
    </main>
  );
}
