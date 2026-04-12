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
      <p className="section-label">{eyebrow}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight text-text sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-text-secondary">
            {description}
          </p>
        </div>
        {actions}
      </div>
    </div>
  );
}
