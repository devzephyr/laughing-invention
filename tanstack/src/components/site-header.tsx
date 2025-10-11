"use client";

import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-neutral-800 dark:supports-[backdrop-filter]:bg-neutral-900/40">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-3">
        <Link to="/" className="font-semibold tracking-tight transition-colors hover:text-emerald-600">
          Adeyemi
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
