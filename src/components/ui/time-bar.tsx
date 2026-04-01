import { TIME_WINDOW_LABELS, TIME_WINDOW_PROGRESS } from "@/lib/constants";
import type { TimeWindow } from "@/types/trip";

export function TimeBar({ timeWindow }: { timeWindow: TimeWindow }) {
  const progress = TIME_WINDOW_PROGRESS[timeWindow];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-text-secondary">
        <span>Window</span>
        <span>{TIME_WINDOW_LABELS[timeWindow]}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-black/[0.08]">
        <div
          className="absolute bottom-0 top-0 rounded-full bg-accent/80"
          style={{
            left: `${progress.startPct}%`,
            width: `${progress.endPct - progress.startPct}%`,
          }}
        />
      </div>
    </div>
  );
}
