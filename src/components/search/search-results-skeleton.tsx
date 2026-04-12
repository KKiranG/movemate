export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-xl border border-border p-4"
        >
          <div className="mb-3 flex justify-between gap-4">
            <div className="h-5 w-1/3 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
            <div className="h-5 w-16 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          </div>
          <div className="mb-2 h-4 w-1/2 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          <div className="mb-4 h-4 w-2/3 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
            <div className="h-8 w-20 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          </div>
        </div>
      ))}
    </div>
  );
}
