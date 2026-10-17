import React from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-semibold shadow-xs cursor-pointer select-none ${className}`}
    >
      {theme === "dark" ? "☀️ Mode Clair" : "🌙 Mode Sombre"}
    </button>
  );
}
