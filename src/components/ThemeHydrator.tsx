"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeHydrator() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
