import Link from "next/link";
import { BedDouble, Box, CircleHelp, LampDesk, Refrigerator, Sofa } from "lucide-react";

import { StickyCta, WizardHeader } from "@/components/spec/wizard";

const categories = [
  { label: "Sofa", icon: Sofa, href: "/move/new/timing", active: true },
  { label: "Bed", icon: BedDouble, href: "/move/new/timing" },
  { label: "Fridge", icon: Refrigerator, href: "/move/new/timing" },
  { label: "Boxes", icon: Box, href: "/move/new/timing" },
  { label: "Desk", icon: LampDesk, href: "/move/new/timing" },
  { label: "Other", icon: CircleHelp, href: "#other" },
] satisfies ReadonlyArray<{
  label: string;
  icon: typeof Sofa;
  href: string;
  active?: boolean;
}>;

export default function MoveItemPage() {
  return (
    <main className="pb-28">
      <WizardHeader step={2} backHref="/move/new/route" />
      <section className="screen screen-wide space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">What’s moving</p>
          <h1 className="heading">Tell us about the item</h1>
          <p className="body text-[var(--text-secondary)]">
            This is how we filter out the wrong fits before you ever see them.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.label}
                href={category.href}
                className={`flex min-h-[120px] min-w-[44px] flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border px-3 text-center ${
                  category.active
                    ? "border-transparent bg-[var(--text-primary)] text-[var(--bg-base)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[12px] font-medium leading-4">{category.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="surface-1 space-y-3">
          <p className="title">Variant</p>
          <div className="grid grid-cols-2 gap-2">
            {["2-seater", "3-seater", "Modular", "L-shape"].map((variant, index) => (
              <button
                key={variant}
                type="button"
                className={`min-h-[48px] rounded-[var(--radius-md)] border px-3 text-[13px] font-medium ${
                  index === 1
                    ? "border-[var(--text-primary)] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
                }`}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>

        <div id="other" className="surface-1 space-y-3">
          <p className="title">If it’s something else</p>
          <textarea className="ios-input min-h-[108px]" placeholder='Describe the item, e.g. "Large mirror, 1.8m tall"' />
          <label className="flex min-h-[110px] min-w-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated-2)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-3)] active:bg-[var(--bg-elevated-3)]">
            Add a photo
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/heic,image/heif" capture="environment" />
          </label>
        </div>
      </section>
      <StickyCta href="/move/new/timing" label="Continue to timing" />
    </main>
  );
}
