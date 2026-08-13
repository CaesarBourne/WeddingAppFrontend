import { TopProgressBar } from "@/components/ui/TopProgressBar";

// Automatic Suspense fallback for every route in the app (no nested layouts
// beyond the root, so this is the shared boundary for every navigation).
// Shown the instant a click happens, before the destination's data arrives —
// see https://nextjs.org/docs/app/api-reference/file-conventions/loading
export default function Loading() {
  return <TopProgressBar />;
}
