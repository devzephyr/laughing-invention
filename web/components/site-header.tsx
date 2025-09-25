"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
        <span className="font-semibold tracking-tight">Adeyemi</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
