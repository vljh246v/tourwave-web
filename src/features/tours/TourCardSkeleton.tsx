export function TourCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "rounded-xl overflow-hidden bg-white shadow-sm border border-border flex-shrink-0 animate-pulse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="h-40 w-full bg-surface" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-surface" />
        <div className="h-3 w-1/2 rounded bg-surface" />
        <div className="h-4 w-1/3 rounded bg-surface" />
      </div>
    </div>
  );
}
