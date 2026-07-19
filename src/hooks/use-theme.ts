"use client";

import { useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "emma-funmi-theme";

const getInitial = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const useTheme = () => {
  // Always start at "light" so the client's first render matches the server's
  // (which has no access to localStorage/matchMedia). The inline script in
  // layout.tsx already sets the `dark` class on <html> before paint to avoid a
  // visual flash; this just syncs React's own state to match right after mount.
  const [theme, setTheme] = useState<Theme>("light");
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      setTheme(getInitial());
      return;
    }
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
};
