/**
 * UAE Flag strip — decorative horizontal bar with the four flag colours.
 * Red | Green / White / Black
 */
export function UAEFlagStrip({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-1.5 w-full overflow-hidden rounded-full ${className ?? ''}`}
      aria-hidden="true"
    >
      {/* Red vertical band — proportionally wider */}
      <div className="w-[25%] bg-[hsl(0_84%_40%)]" />
      {/* Green */}
      <div className="flex-1 bg-[hsl(145_63%_32%)]" />
      {/* White */}
      <div className="flex-1 bg-[hsl(0_0%_97%)] dark:bg-[hsl(0_0%_85%)]" />
      {/* Black */}
      <div className="flex-1 bg-[hsl(0_0%_8%)]" />
    </div>
  );
}

/** Inline UAE flag emoji badge */
export function UAEBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${className ?? ''}`}
      aria-label="UAE"
    >
      🇦🇪 UAE
    </span>
  );
}
