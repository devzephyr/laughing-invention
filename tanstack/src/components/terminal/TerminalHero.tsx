"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";

type Entry = { prompt: string; output?: string };

const COMMANDS: Record<string, string> = {
  help: "commands: help, projects, labs, writeups, reading, cv, contact, clear",
  projects: "→ navigating to /projects",
  labs: "→ navigating to /labs",
  writeups: "→ navigating to /writeups",
  reading: "→ navigating to /reading",
  cv: "→ opening resume.pdf",
  contact: "→ navigating to /contact",
  clear: "__CLEAR__",
};

export default function TerminalHero() {
  const navigate = useNavigate();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") { e.preventDefault(); setHistory([]); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [history, setHistory] = useState<Entry[]>([
    { prompt: 'echo "hi, I’m Adeyemi — cybersecurity student & builder"' },
    { prompt: 'type "help" to get started' },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState<number>(-1);

  useEffect(() => inputRef.current?.focus(), []);

  function handleCommand(cmd: string) {
    const normalized = cmd.trim().toLowerCase();
    if (!normalized) {
      setSuggestOpen(false);
      setSuggestIdx(-1);
      return;
    }

    const response = COMMANDS[normalized] ?? `command not found: ${normalized}`;
    if (response === "__CLEAR__") {
      setHistory([]);
      setHistoryIdx(null);
      setSuggestOpen(false);
      setSuggestIdx(-1);
      return;
    }
    setHistory((h) => [...h, { prompt: `$ ${cmd}`, output: response }]);

    const complete = () => {
      setHistoryIdx(null);
      setSuggestOpen(false);
      setSuggestIdx(-1);
    };

    if (normalized === "help") {
      setShowHelp(true);
      complete();
      return;
    }
    if (normalized === "cv") {
      window.open("/resume.pdf", "_blank", "noopener,noreferrer");
      complete();
      return;
    }

    const navHandlers: Record<string, () => void> = {
      projects: () => navigate({ to: "/projects" }),
      labs: () => navigate({ to: "/labs" }),
      writeups: () => navigate({ to: "/writeups" }),
      reading: () => navigate({ to: "/reading" }),
      contact: () => navigate({ to: "/contact" }),
    };

    const handler = navHandlers[normalized];
    if (handler) {
      handler();
      complete();
      return;
    }

    complete();
  }

  return (
    <div className="relative mx-auto max-w-3xl p-4 md:p-6 font-mono bg-black text-emerald-300 border border-emerald-700/40 rounded-lg shadow-[0_0_40px_-20px_rgba(16,185,129,0.6)]">
      <button
        onClick={() => setShowHelp(true)}
        className="absolute right-3 top-3 text-xs px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/30"
        aria-label="Open help"
      >
        help
      </button>
      <div className="space-y-2">
        {history.map((e, i) => (
          <div key={i}>
            <div className="whitespace-pre-wrap">{e.prompt}</div>
            {e.output && <div className="opacity-80">{e.output}</div>}
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = inputRef.current!;
            const value = input.value;
            input.value = "";
            handleCommand(value);
          }}
          className="flex gap-2 items-center"
          aria-label="Terminal input"
        >
          <span aria-hidden>$</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none placeholder-emerald-700/70"
            placeholder="help"
            onKeyDown={(e) => {
              const input = e.currentTarget;
              const valNow = (input.value || "").trim().toLowerCase();
              const matches = Object.keys(COMMANDS).filter((k) => valNow && k.startsWith(valNow));
              const hasMatches = matches.length > 0;
              if (!hasMatches && suggestIdx !== -1) setSuggestIdx(-1);
              if (hasMatches !== suggestOpen) setSuggestOpen(hasMatches);

              if (!["ArrowUp", "ArrowDown", "Tab"].includes(e.key)) {
                setHistoryIdx(null);
              }

              if (e.key === "Escape" && suggestOpen) {
                e.preventDefault();
                setSuggestOpen(false);
                setSuggestIdx(-1);
                return;
              }

              if (e.key === "Tab") {
                if (!hasMatches) return;
                e.preventDefault();
                if (matches.length === 1) {
                  input.value = matches[0];
                  setSuggestOpen(false);
                  setSuggestIdx(-1);
                } else {
                  const nextIdx = suggestIdx === -1 ? 0 : (suggestIdx + 1) % matches.length;
                  setSuggestIdx(nextIdx);
                  input.value = matches[nextIdx];
                }
                requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
                return;
              }

              if (hasMatches && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                e.preventDefault();
                if (matches.length === 0) return;
                if (e.key === "ArrowDown") {
                  const nextIdx = (suggestIdx + 1 + matches.length) % matches.length;
                  setSuggestIdx(nextIdx);
                } else {
                  const nextIdx = suggestIdx <= 0 ? matches.length - 1 : suggestIdx - 1;
                  setSuggestIdx(nextIdx);
                }
                return;
              }

              if (hasMatches && e.key === "Enter" && suggestIdx >= 0) {
                input.value = matches[suggestIdx];
                setSuggestOpen(false);
                setSuggestIdx(-1);
                return;
              }

              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const cmds = history
                  .filter((h) => h.prompt.startsWith("$ "))
                  .map((h) => h.prompt.slice(2));
                if (cmds.length === 0) return;
                let idx = historyIdx;
                if (idx === null) idx = cmds.length;
                idx = e.key === "ArrowUp" ? Math.max(0, idx - 1) : Math.min(cmds.length, idx + 1);
                setHistoryIdx(idx);
                const value = idx === cmds.length ? "" : cmds[idx];
                input.value = value;
                setSuggestOpen(false);
                setSuggestIdx(-1);
                requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
              }
            }}
          />
        </form>
        {suggestOpen && (
          <div className="mt-1 rounded-md border border-emerald-700/40 bg-black/80 text-emerald-300 text-xs shadow-lg">
            {Object.keys(COMMANDS)
              .filter((k) => ((inputRef.current?.value || "").trim().toLowerCase()) && k.startsWith((inputRef.current?.value || "").trim().toLowerCase()))
              .map((k, i) => (
                <div
                  key={k}
                  className={`px-2 py-1 cursor-pointer ${i === suggestIdx ? 'bg-emerald-600/30' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (inputRef.current) inputRef.current.value = k;
                    setSuggestOpen(false);
                    setSuggestIdx(-1);
                  }}
                >
                  {k}
                </div>
              ))}
          </div>
        )}
      </div>
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-lg border-emerald-700/30">
          <DialogHeader>
            <DialogTitle className="font-mono">Terminal Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="opacity-80">Commands</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>help — show this overlay</li>
              <li>projects — go to Projects</li>
              <li>labs — go to Labs</li>
              <li>writeups — go to Write-ups</li>
              <li>reading — go to Reading</li>
              <li>cv — open resume</li>
              <li>contact — go to Contact</li>
              <li>clear — clear terminal output</li>
            </ul>
            <p className="opacity-80 pt-2">Shortcuts</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Enter — run command</li>
              <li>Click “help” in the corner to reopen this</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
