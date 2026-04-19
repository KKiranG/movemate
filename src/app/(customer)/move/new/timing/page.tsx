import Link from "next/link";

import { WizardHeader } from "@/components/spec/wizard";

const options = [
  { label: "On this date", detail: "Pick a specific day and window." },
  { label: "Flexible within a week", detail: "Better match odds, often cheaper." },
  { label: "Flexible — anytime", detail: "Best if you care most about getting a match." },
];

export default function MoveTimingPage() {
  return (
    <main>
      <WizardHeader step={3} backHref="/move/new/item" />
      <section className="screen screen-wide space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">When</p>
          <h1 className="heading">When do you need it moved?</h1>
          <p className="body text-[var(--text-secondary)]">
            Flexible timing increases the chance we can place you into real spare capacity.
          </p>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <Link
              key={option.label}
              href="/move/new/access"
              className={`block rounded-[var(--radius-lg)] border p-4 ${
                index === 1
                  ? "border-[color:rgba(201,82,28,0.24)] bg-[var(--accent-subtle)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="title">{option.label}</p>
                  <p className="mt-1 caption">{option.detail}</p>
                </div>
                <span className="text-[var(--text-tertiary)]">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
