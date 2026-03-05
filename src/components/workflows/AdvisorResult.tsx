"use client";

import { useState, useCallback } from "react";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdvisorAgent {
    role: string;
    tool: string;
    slug: string | null;
    brief: string;
}

export interface AdvisorScaffoldStep {
    phase: string;
    action: string;
    tool: string;
    output: string;
}

export interface AdvisorData {
    title: string;
    emoji: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    agentTeam: AdvisorAgent[];
    scaffold: AdvisorScaffoldStep[];
    starterPrompt: string;
    keywords: string[];
    levelUp: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors cursor-pointer"
            title={copied ? "Copied!" : "Copy to clipboard"}
        >
            {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
                <Copy className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            )}
        </button>
    );
}

function CollapsibleSection({
    title,
    children,
    defaultOpen = true,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-[var(--border)]">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-3 text-left cursor-pointer group"
            >
                <span className="text-sm font-bold text-[var(--foreground)] group-hover:text-primary transition-colors">
                    {title}
                </span>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                )}
            </button>
            {open && <div className="pb-4">{children}</div>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_CONFIG = {
    beginner: { label: "Beginner", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30" },
    intermediate: { label: "Intermediate", className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30" },
    advanced: { label: "Advanced", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30" },
} as const;

function highlightPlaceholders(text: string): React.ReactNode[] {
    const parts = text.split(/(\[.+?\])/g);
    return parts.map((part, i) =>
        /^\[.+\]$/.test(part) ? (
            <span key={i} className="font-bold text-primary">
                {part}
            </span>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface AdvisorResultProps {
    data: AdvisorData;
    toolLogos: Record<string, string | null>;
}

export function AdvisorResult({ data, toolLogos }: AdvisorResultProps) {
    const difficulty = DIFFICULTY_CONFIG[data.difficulty] || DIFFICULTY_CONFIG.beginner;

    return (
        <div className="animate-in fade-in duration-500 space-y-0">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                    <span className="text-2xl">{data.emoji}</span>
                    {data.title}
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", difficulty.className)}>
                        {difficulty.label}
                    </span>
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {data.description}
                </p>
            </div>

            {/* Agent Team */}
            {data.agentTeam.length > 0 && (
                <CollapsibleSection title="🤖 Agent Team">
                    <div className="flex flex-wrap gap-2">
                        {data.agentTeam.map((agent, i) => {
                            const logo = agent.slug ? toolLogos[agent.slug] : null;
                            const inner = (
                                <div
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                                        "bg-[var(--surface)] border border-[var(--border)]",
                                        agent.slug
                                            ? "hover:border-primary/40"
                                            : "hover:border-amber-300 dark:hover:border-amber-600"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--surface)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                        {logo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={logo}
                                                alt={agent.tool}
                                                className="w-5 h-5 object-contain"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-[var(--muted-foreground)]">
                                                {agent.tool.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                                                {agent.role}
                                            </span>
                                            <span className="font-medium text-[var(--foreground)] truncate">
                                                {agent.tool}
                                            </span>
                                        </div>
                                        <span className="text-xs text-[var(--muted-foreground)] truncate block mt-0.5">
                                            {agent.brief}
                                        </span>
                                    </div>
                                </div>
                            );

                            if (agent.slug) {
                                return (
                                    <a
                                        key={i}
                                        href={`/tools/${agent.slug}`}
                                        className="no-underline"
                                    >
                                        {inner}
                                    </a>
                                );
                            }

                            return <div key={i}>{inner}</div>;
                        })}
                    </div>
                </CollapsibleSection>
            )}

            {/* Scaffold */}
            <CollapsibleSection title="🏗️ Scaffold">
                <div className="space-y-3">
                    {data.scaffold.map((step, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {i + 1}
                            </div>
                            <div className="min-w-0 pt-0.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm text-[var(--foreground)]">
                                        {step.phase}
                                    </span>
                                    {step.tool && (
                                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)]">
                                            {step.tool}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                                    {step.action}
                                </p>
                                <span className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                    → {step.output}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            {/* Starter Prompt */}
            <CollapsibleSection title="✍️ Starter Prompt">
                <div className="flex items-start gap-2 bg-[var(--surface)] rounded-xl px-3.5 py-2.5 border border-[var(--border)]">
                    <p className="text-sm text-[var(--foreground)] leading-relaxed flex-1 font-mono whitespace-pre-wrap">
                        {highlightPlaceholders(data.starterPrompt)}
                    </p>
                    <CopyButton text={data.starterPrompt} />
                </div>
            </CollapsibleSection>

            {/* Keywords */}
            {data.keywords.length > 0 && (
                <CollapsibleSection title="🔑 Keywords">
                    <div className="flex flex-wrap gap-2">
                        {data.keywords.map((kw, i) => (
                            <a
                                key={i}
                                href={`https://www.google.com/search?q=${encodeURIComponent(kw)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer no-underline"
                            >
                                {kw}
                            </a>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Level Up */}
            {data.levelUp && (
                <div className="border-t border-[var(--border)] pt-3">
                    <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15">
                        <span className="text-lg shrink-0">🎓</span>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            <span className="font-bold">Level Up: </span>
                            {data.levelUp}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
