"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { title: "Secure", blurb: "threat-aware by default" },
  { title: "Curious", blurb: "always digging deeper" },
  { title: "Hands‑on", blurb: "labs, tooling, writeups" },
];

export default function PinnedIntro() {
  const [active, setActive] = useState(0);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).dataset.index || 0);
          if (e.isIntersecting) setActive(idx);
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );
    stepsRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section aria-label="Intro" className="relative h-[240vh] border-t border-neutral-200 dark:border-neutral-800">
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="text-center select-none">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
            {ITEMS[active]?.title}
          </h2>
          <p className="mt-2 opacity-80">{ITEMS[active]?.blurb}</p>
        </div>
      </div>
      {/* scroll steps */}
      <div className="[&>*]:h-[80vh]">
        {ITEMS.map((_, i) => (
          <div
            key={i}
            ref={(el: HTMLDivElement | null) => { stepsRef.current[i] = el; }}
            data-index={i}
          />
        ))}
      </div>
    </section>
  );
}
