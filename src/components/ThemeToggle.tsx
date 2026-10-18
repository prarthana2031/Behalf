"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("behalf-theme");
    const initial: Theme = saved === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = initial;
    setTheme(initial);
  }, []);

  function selectTheme(next: Theme) {
    document.documentElement.dataset.theme = next;
    localStorage.setItem("behalf-theme", next);
    setTheme(next);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button type="button" aria-pressed={theme === "light"} onClick={() => selectTheme("light")}>Light</button>
      <button type="button" aria-pressed={theme === "dark"} onClick={() => selectTheme("dark")}>Dark</button>
    </div>
  );
}