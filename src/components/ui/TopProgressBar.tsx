/**
 * Thin indeterminate bar shown at the top of the viewport while a route
 * segment is loading (rendered automatically by Next as a loading.tsx
 * fallback — see app/loading.tsx). Gives instant visual feedback on slow
 * navigations instead of a frozen screen.
 */
export function TopProgressBar() {
  return (
    <div className="fixed left-0 right-0 top-0 z-[200] h-1 overflow-hidden bg-transparent">
      <div
        className="absolute top-0 h-full bg-gradient-gold shadow-gold"
        style={{ animation: "progress-indeterminate 1.4s ease-in-out infinite" }}
      />
    </div>
  );
}
