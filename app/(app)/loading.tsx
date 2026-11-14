export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200/70" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200/60" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface h-20 animate-pulse" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="surface h-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
