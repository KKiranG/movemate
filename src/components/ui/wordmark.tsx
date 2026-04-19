import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
      fill="none"
    >
      <path
        d="M3 20V7c0-1 1-1.5 1.7-.8L12 14l7.3-7.8c.7-.7 1.7-.2 1.7.8v13"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <circle cx="12" cy="14" r="1.6" fill={color} />
    </svg>
  );
}

export function Wordmark({
  className,
  color,
  showMark = true,
}: {
  className?: string;
  color?: string;
  showMark?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[18px] font-semibold tracking-[-0.04em]",
        className,
      )}
      style={{ color }}
    >
      {showMark ? <BrandMark className="h-5 w-5" color={color ?? "currentColor"} /> : null}
      <span>moverrr</span>
    </div>
  );
}
