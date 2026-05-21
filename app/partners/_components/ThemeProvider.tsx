"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("fp-portal-theme") as Theme | null;
    if (stored === "dark") setTheme("dark");
  }, []);

  function toggle() {
    setTheme(t => {
      const next = t === "light" ? "dark" : "light";
      localStorage.setItem("fp-portal-theme", next);
      return next;
    });
  }

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div data-theme={theme} style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}
