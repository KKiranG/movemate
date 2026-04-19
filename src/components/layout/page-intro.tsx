import type { ReactNode } from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: PageIntroProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow">{eyebrow}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="heading max-w-[14ch]">{title}</h1>
          <p className="max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
        {actions}
      </div>
    </div>
  );
}
