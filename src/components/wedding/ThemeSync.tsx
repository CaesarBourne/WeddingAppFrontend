"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getInitial } from "@/hooks/use-theme";

/**
 * Reasserts the `dark` class on <html> after every client-side (RSC) navigation.
 * Next.js re-renders <html> with the layout's static className on route changes,
 * which wipes the class the inline anti-flash script added — pages without a
 * ThemeToggle (e.g. /food) have nothing else to restore it. This component lives
 * in the persistent layout shell (not swapped per-route), so it survives every
 * navigation and reapplies the theme each time the path changes.
 */
export function ThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", getInitial() === "dark");
  }, [pathname]);

  return null;
}
