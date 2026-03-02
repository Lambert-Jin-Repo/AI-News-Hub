"use client";

import { useState, useCallback } from "react";
import { Check, Copy, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdvisorTool {
    name: string;
    slug: string | null;
    role: string;
    isExternal: boolean;
    url: string | null;
}

export interface AdvisorStep {
    order: number;
    title: string;
    description: string;
    toolName: string | null;
}

export interface AdvisorPromptTemplate {
    label: string;
    prompt: string;
}

export interface AdvisorData {
    title: string;
    emoji: string;
    description: string;
    tools: AdvisorTool[];
    steps: AdvisorStep[];
    tips: string[];
    promptTemplates: AdvisorPromptTemplate[];
    pitfalls: string[];
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
// Main Component
// ---------------------------------------------------------------------------

interface AdvisorResultProps {
    data: AdvisorData;
    toolLogos: Record<string, string | null>;
}

export function AdvisorResult({ data, toolLogos }: AdvisorResultProps) {
    return (
        <div className="animate-in fade-in duration-500 space-y-0">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                    <span className="text-2xl">{data.emoji}</span>
                    {data.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {data.description}
                </p>
            </div>

            {/* Tools Row */}
            {data.tools.length > 0 && (
                <CollapsibleSection title="🛠️ Recommended Tools">
                    <div className="flex flex-wrap gap-2">
                        {data.tools.map((tool, i) => {
                            const logo = tool.slug ? toolLogos[tool.slug] : null;
                            const inner = (
                                <div
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                                        "bg-[var(--surface)] border border-[var(--border)]",
                                        tool.isExternal
                                            ? "hover:border-amber-300 dark:hover:border-amber-600"
                                            : "hover:border-primary/40"
                                    )}
                                >
                                    {/* Icon */}
                                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--surface)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                        {logo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={logo}
                                                alt={tool.name}
                                                className="w-5 h-5 object-contain"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-[var(--muted-foreground)]">
                                                {tool.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-[var(--foreground)] truncate">
                                                {tool.name}
                                            </span>
                                            {tool.isExternal && (
                                                <ExternalLink className="w-3 h-3 text-amber-500 shrink-0" />
                                            )}
                                        </div>
                                        <span className="text-xs text-[var(--muted-foreground)] truncate block">
                                            {tool.role}
                                        </span>
                                    </div>
                                </div>
                            );

                            if (tool.isExternal && tool.url) {
                                return (
                                    <a
                                        key={i}
                                        href={tool.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="no-underline"
                                    >
                                        {inner}
                                    </a>
                                );
                            }

                            if (tool.slug) {
                                return (
                                    <a
                                        key={i}
                                        href={`/tools/${tool.slug}`}
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

            {/* Steps */}
            <CollapsibleSection title="📋 Step-by-Step Workflow">
                <div className="space-y-3">
                    {data.steps.map((step) => (
                        <div key={step.order} className="flex gap-3">
                            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {step.order}
                            </div>
                            <div className="min-w-0 pt-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-[var(--foreground)]">
                                        {step.title}
                                    </span>
                                    {step.toolName && (
                                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--surface)] text-[var(--muted-foreground)]">
                                            {step.toolName}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            {/* Tips */}
            {data.tips.length > 0 && (
                <CollapsibleSection title="💡 Pro Tips">
                    <ul className="space-y-2">
                        {data.tips.map((tip, i) => (
                            <li
                                key={i}
                                className="text-sm text-[var(--muted-foreground)] leading-relaxed pl-1"
                            >
                                {tip}
                            </li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}

            {/* Prompt Templates */}
            {data.promptTemplates.length > 0 && (
                <CollapsibleSection title="✍️ Prompt Templates">
                    <div className="space-y-3">
                        {data.promptTemplates.map((pt, i) => (
                            <div key={i}>
                                <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">
                                    {pt.label}
                                </span>
                                <div className="flex items-start gap-2 bg-[var(--surface)] rounded-xl px-3.5 py-2.5 border border-[var(--border)]">
                                    <p className="text-sm text-[var(--foreground)] leading-relaxed flex-1 font-mono whitespace-pre-wrap">
                                        {pt.prompt}
                                    </p>
                                    <CopyButton text={pt.prompt} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Pitfalls */}
            {data.pitfalls.length > 0 && (
                <CollapsibleSection title="⚠️ Watch Out For" defaultOpen={false}>
                    <ul className="space-y-2">
                        {data.pitfalls.map((p, i) => (
                            <li
                                key={i}
                                className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed pl-1"
                            >
                                {p}
                            </li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}
        </div>
    );
}
