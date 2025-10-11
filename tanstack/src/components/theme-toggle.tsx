"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

const order: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function cycle() {
    const current = (theme as "light" | "dark" | "system" | undefined) ?? "system";
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }

  const icon = theme === "dark" ? (
    <Moon className="h-4 w-4" />
  ) : theme === "light" ? (
    <Sun className="h-4 w-4" />
  ) : (
    <Laptop className="h-4 w-4" />
  );

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={cycle}>
      {mounted ? icon : <Sun className="h-4 w-4" />}
    </Button>
  );
}
