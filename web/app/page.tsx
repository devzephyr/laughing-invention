"use client";
import dynamic from "next/dynamic";
import TerminalHero from "@/components/terminal/TerminalHero";
const PinnedIntro = dynamic(() => import("@/components/scroll/PinnedIntro"), { ssr: false });
import { Reveal } from "@/components/scroll/Reveal";

const BackgroundField = dynamic(
  () => import("@/components/background/BackgroundField"),
  { ssr: false }
);

export default function Home() {
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
      <PinnedIntro />
      <section id="projects" className="py-20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto p-6">
          <h2 className="text-lg font-semibold mb-2">Projects</h2>
          <div className="grid gap-6">
            <Reveal><p className="opacity-80">Coming soon — cards for 6–9 projects.</p></Reveal>
          </div>
        </div>
      </section>

      <section id="labs" className="py-20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto p-6">
          <h2 className="text-lg font-semibold mb-2">Labs</h2>
          <Reveal><p className="opacity-80">SEED exercises and lab notes.</p></Reveal>
        </div>
      </section>

      <section id="writeups" className="py-20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto p-6">
          <h2 className="text-lg font-semibold mb-2">Write-ups</h2>
          <Reveal><p className="opacity-80">CTFs, hunts, and troubleshooting posts.</p></Reveal>
        </div>
      </section>

      <section id="reading" className="py-20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto p-6">
          <h2 className="text-lg font-semibold mb-2">What I’m reading</h2>
          <Reveal><p className="opacity-80">Reading feed with scroll reveals.</p></Reveal>
        </div>
      </section>
    </div>
  );
}
