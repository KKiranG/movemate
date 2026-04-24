export default function CarrierPayoutsLoading() {
  return (
    <main id="main-content" className="screen animate-pulse">
      <div className="mb-6">
        <div className="mb-2 h-3 w-20 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
        <div className="mb-2 h-7 w-56 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
        <div className="h-4 w-72 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="mb-3 h-4 w-1/2 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
            <div className="h-8 w-1/3 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="mb-2 h-4 w-2/5 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
            <div className="h-4 w-1/3 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          </div>
        ))}
      </div>
    </main>
  );
}
