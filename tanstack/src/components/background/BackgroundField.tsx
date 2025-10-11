"use client";

import { useEffect, useRef } from "react";

export default function BackgroundField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // Field-line effect: thin lines bending with a vector field and cursor.
  const seeds = useRef<{ x: number; y: number }[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    function onResize() {
      w = (canvas.width = window.innerWidth);
      h = (canvas.height = window.innerHeight);
      // recompute seeds on resize
      initSeeds();
    }

    function onMouseMove(e: MouseEvent) {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    }

    function initSeeds() {
      const cols = Math.max(12, Math.floor(w / 160));
      const rows = Math.max(8, Math.floor(h / 160));
      const spacingX = w / cols;
      const spacingY = h / rows;
      const arr: { x: number; y: number }[] = [];
      for (let i = 1; i < cols; i++) {
        for (let j = 1; j < rows; j++) {
          arr.push({ x: i * spacingX, y: j * spacingY });
        }
      }
      seeds.current = arr;
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    initSeeds();

    function step() {
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains("dark");
      ctx.lineWidth = 1;
      const line = isDark ? "rgba(16,185,129,0.12)" : "rgba(60,60,60,0.12)";
      const highlight = isDark ? "rgba(16,185,129,0.28)" : "rgba(60,60,60,0.28)";

      const t = performance.now() * 0.00015; // slow evolution

      for (const s of seeds.current) {
        const dx = s.x / 160 + t;
        const dy = s.y / 160 - t;
        let vx = Math.cos(dx) * 0.8 + Math.sin(dy) * 0.8;
        let vy = Math.sin(dx) * 0.8 - Math.cos(dy) * 0.8;

        const mx = mouse.current.x;
        const my = mouse.current.y;
        const ddx = mx - s.x;
        const ddy = my - s.y;
        const dist2 = ddx * ddx + ddy * ddy;
        if (dist2 < 200 * 200) {
          const f = (1 - Math.sqrt(dist2) / 200) * 0.8;
          vx += (ddx / 200) * f;
          vy += (ddy / 200) * f;
        }

        const steps = 14;
        let x = s.x;
        let y = s.y;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i < steps; i++) {
          x += vx;
          y += vy;
          ctx.lineTo(x, y);
          const a = 0.08;
          const nx = vx * Math.cos(a) - vy * Math.sin(a);
          const ny = vx * Math.sin(a) + vy * Math.cos(a);
          vx = nx * 0.98;
          vy = ny * 0.98;
        }
        ctx.strokeStyle = dist2 < 180 * 180 ? highlight : line;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(step);
    }

    function start() {
      if (!prefersReduced && document.visibilityState === "visible" && !rafRef.current) {
        rafRef.current = requestAnimationFrame(step);
      }
    }
    function stop() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        start();
      }
    }

    function onLowPower(evt: Event) {
      const enabled = (evt as CustomEvent<boolean>).detail ?? true;
      if (enabled) {
        stop();
      } else {
        start();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("lowpowerchange", onLowPower as EventListener);

    // initial start
    start();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("lowpowerchange", onLowPower as EventListener);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]"
    />
  );
}
