export default function CarrierTripDetailLoading() {
  return (
    <main id="main-content" className="screen animate-pulse">
      <div className="mb-6">
        <div className="mb-2 h-3 w-20 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
        <div className="mb-2 h-7 w-52 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
        <div className="h-4 w-40 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 h-5 w-1/3 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          <div className="mb-2 h-4 w-1/2 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          <div className="mb-2 h-4 w-2/3 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          <div className="h-4 w-2/5 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
        </div>

        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="mb-3 h-5 w-1/4 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
            <div className="mb-2 h-4 w-1/2 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
            <div className="h-4 w-2/3 rounded bg-black/[0.08] dark:bg-white/[0.12]" />
          </div>
        ))}
      </div>
    </main>
  );
}
