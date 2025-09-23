"use client";

import dynamic from "next/dynamic";
import TerminalHero from "@/components/terminal/TerminalHero";

const BackgroundField = dynamic(
  () => import("@/components/background/BackgroundField"),
  { ssr: false }
);

export default function HomeClient() {
  return (
    <div className="relative min-h-screen">
      <BackgroundField />
      <section className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full">
          <TerminalHero />
          <div className="mx-auto max-w-3xl mt-6 text-center text-sm opacity-80">
            <p>secure • curious • hands-on</p>
          </div>
        </div>
      </section>
    </div>
  );
}

