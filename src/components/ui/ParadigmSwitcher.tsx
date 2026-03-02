"use client";

import { useState, useRef, useEffect } from "react";
import { useParadigm, PARADIGMS, type Paradigm } from "@/components/providers/ParadigmProvider";
import { Palette, Check } from "lucide-react";

const PARADIGM_META: Record<string, { label: string; color: string; desc: string }> = {
  glass: { label: "Glass", color: "#667eea", desc: "Frosted translucency" },
  m3e: { label: "Material", color: "#6750A4", desc: "Expressive surfaces" },
  brutalist: { label: "Brutalist", color: "#FF6B9D", desc: "Bold & raw" },
  bento: { label: "Bento", color: "#4ECDC4", desc: "Grid layouts" },
};

export function ParadigmSwitcher() {
  const { paradigm, setParadigm } = useParadigm();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!mounted) {
    return (
      <button className="relative p-2 rounded-full text-[var(--muted-foreground)] bg-[var(--surface)] opacity-50 cursor-default size-9">
        <Palette className="h-5 w-5" />
        <span className="sr-only">Design style</span>
      </button>
    );
  }

  const currentColor = paradigm ? PARADIGM_META[paradigm].color : "var(--color-primary)";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full transition-colors duration-200
          text-[var(--foreground)] hover:bg-black/5
          dark:hover:bg-white/10
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        aria-label={`Design style: ${paradigm ? PARADIGM_META[paradigm].label : "Default"}`}
        aria-expanded={open}
        aria-haspopup="true"
        title="Switch design style"
      >
        <Palette className="h-5 w-5" style={{ color: currentColor }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 py-1.5 rounded-xl border border-[var(--border)] shadow-lg z-50 overflow-hidden"
          style={{ background: "var(--surface)", backdropFilter: "blur(var(--backdrop-blur, 12px))" }}
          role="menu"
        >
          {/* Default option */}
          <button
            onClick={() => { setParadigm(null); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            role="menuitem"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0 border-2"
              style={{ borderColor: "var(--color-primary)", backgroundColor: paradigm === null ? "var(--color-primary)" : "transparent" }}
            />
            <span className="flex-1">
              <span className="font-medium text-[var(--foreground)]">Default</span>
              <span className="block text-xs text-[var(--muted-foreground)]">Original theme</span>
            </span>
            {paradigm === null && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
          </button>

          <div className="mx-3 my-1 border-t border-[var(--border)]" />

          {/* Paradigm options */}
          {PARADIGMS.map((p) => {
            const meta = PARADIGM_META[p];
            const isActive = paradigm === p;
            return (
              <button
                key={p}
                onClick={() => { setParadigm(p); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                role="menuitem"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="flex-1">
                  <span className="font-medium text-[var(--foreground)]">{meta.label}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">{meta.desc}</span>
                </span>
                {isActive && <Check className="w-4 h-4" style={{ color: meta.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
