# Workflow Advisor v2 — Agent Team Blueprint Design

> **Date:** 2026-03-05
> **Status:** Implemented (2026-03-05)
> **Goal:** Redesign the AI-generated workflow recommendation to be more practical, actionable, token-efficient, and quality-assured. Align with 2026 multi-agent workflow patterns.

---

## Problem Statement

The current workflow advisor produces structured but often **generic** output:
- Steps are vague ("Use AI to generate content") instead of naming concrete deliverables
- 1-3 prompt templates are mediocre — quantity over quality
- Tips + pitfalls add token overhead without proportional value
- No content quality validation — malformed or irrelevant answers reach users
- Token-inefficient: ~790 output tokens with filler

## Design: Agent Team Blueprint

Reframe output around the **agent-team mental model** — each AI tool plays a specialist role, and the workflow is a phased scaffold where every step names a concrete output.

### New JSON Schema

```json
{
  "title": "AI Landing Page Sprint",
  "emoji": "🚀",
  "description": "Build a conversion-optimised landing page in under 2 hours using an AI agent team.",
  "difficulty": "beginner | intermediate | advanced",
  "agentTeam": [
    {
      "role": "Copywriter",
      "tool": "ChatGPT",
      "slug": "chatgpt",
      "brief": "Drafts headlines, hero copy & CTAs from your brief"
    }
  ],
  "scaffold": [
    {
      "phase": "Brief",
      "action": "Define audience persona, value prop, and one primary CTA",
      "tool": "ChatGPT",
      "output": "1-page creative brief"
    }
  ],
  "starterPrompt": "Act as a senior conversion copywriter. I'm building a landing page for [PRODUCT]. My target audience is [AUDIENCE]. Write 3 headline options (max 10 words each) and a 150-word hero section. Tone: confident but approachable. Include one clear CTA.",
  "keywords": ["conversion copywriting", "hero section", "A/B headline testing", "landing page UX", "brand voice"],
  "levelUp": "Split-test your top 2 headlines with Google Optimize — even 100 visitors will show a clear winner."
}
```

### Schema Field Comparison

| Current Field | New Field | Change Rationale |
|---|---|---|
| `tools[]` (name, role, slug) | `agentTeam[]` (role, tool, slug, brief) | Frames tools as team members with clear jobs |
| `steps[]` (title, description) | `scaffold[]` (phase, action, tool, **output**) | Every step names what you produce |
| `promptTemplates[]` (1-3) | `starterPrompt` (1, best one) | One great prompt > three mediocre ones. Has `[PLACEHOLDERS]` |
| `tips[]` (2-4) | `keywords[]` (3-5) | Learning vocabulary users can Google |
| `pitfalls[]` (1-3) | `levelUp` (1 sentence) | One actionable next step vs. fear-based warnings |
| — | `difficulty` | Helps users gauge complexity |

### Token Efficiency

| Component | Current (est.) | New (est.) |
|---|---|---|
| title + emoji + desc | ~40 | ~40 |
| tools / agentTeam | ~120 | ~100 |
| steps / scaffold | ~200 | ~160 |
| tips | ~100 | — |
| promptTemplates (1-3) | ~250 | — |
| starterPrompt (1) | — | ~80 |
| pitfalls | ~80 | — |
| keywords + levelUp + difficulty | — | ~52 |
| **Total output** | **~790** | **~432** |

**~45% token reduction** while delivering more actionable information.

### Input Token Impact

| Component | Tokens |
|---|---|
| System prompt (injection wrapper + new prompt + 1-shot example) | ~607 |
| User message (goal + 50 tools + wrapping) | ~566 |
| **Total input** | **~1,173** |
| MiniMax M2.5 context window | 196,608 |
| **% used** | **0.6%** |

No risk of exceeding input limits. Safe up to 500+ tools.

---

## New System Prompt

```
You are an AI workflow architect. Given a user's goal and available tools, design a practical agent-team workflow.

Return ONLY valid JSON matching this schema:
{
  "title": "Short, punchy title (max 50 chars)",
  "emoji": "Single emoji representing this workflow",
  "description": "1-2 sentence overview (max 180 chars)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "agentTeam": [
    {
      "role": "Team role name (e.g. Copywriter, Analyst, Designer)",
      "tool": "Tool name",
      "slug": "exact-slug-from-list OR null if external",
      "brief": "What this agent does in one line (max 80 chars)"
    }
  ],
  "scaffold": [
    {
      "phase": "Phase name (1-2 words)",
      "action": "What to do (1 sentence, max 100 chars)",
      "tool": "Which tool handles this phase",
      "output": "Concrete deliverable (e.g. '3 headline variants', '1-page brief')"
    }
  ],
  "starterPrompt": "One ready-to-use prompt with [PLACEHOLDERS] the user fills in. Include a role instruction. Max 300 chars.",
  "keywords": ["3-5 skill/concept tags the user can search to learn more"],
  "levelUp": "One sentence: how to take this workflow further (max 120 chars)"
}

Rules:
- agentTeam: 2-4 agents. Each must map to a tool. Prefer database tools (use exact slug). Set slug to null for external tools.
- scaffold: 3-5 phases. Each phase MUST name a concrete output — not vague advice.
- starterPrompt: ONE prompt only. Specific, actionable, with [BRACKET] placeholders for personalization.
- keywords: Industry terms, skills, or concepts relevant to this workflow.
- levelUp: One power-user tip to graduate from this workflow to the next level.
- difficulty: "beginner" for no-code/simple tools, "intermediate" for multi-tool chains, "advanced" for technical/API work.
- Be practical, not generic. Name specific deliverables, quantities, and formats.
```

Plus a 1-shot example (~150 tokens) embedded after the rules to anchor quality.

---

## Quality Gate System

### Tier 1: Schema Completeness (instant, code-only)

```
- All required fields present and non-empty
- agentTeam: 2-4 items, each has role + tool + brief
- scaffold: 3-5 items, each has phase + action + output
- starterPrompt contains at least one [PLACEHOLDER]
- keywords: 3-5 items, each 2+ words
- levelUp: 20-120 chars
- difficulty: one of beginner/intermediate/advanced
```

### Tier 2: Content Quality Heuristics (instant, code-only)

```
- No field duplicates text from another field
- scaffold outputs are all distinct (not repeating same text)
- starterPrompt length >= 80 chars
- Goal keywords appear somewhere in the response (relevance check)
- No two agents have same role AND same tool
```

### Tier 3: Retry Strategy (on validation failure)

```
- Tier 1 or 2 failure → retry same provider once
- Second failure → fall to next provider in chain
- Third failure → return honest error: "Couldn't generate a quality workflow. Try rephrasing."
  (Better than showing garbage to the user)
```

Philosophy: **Never show the user a bad answer.** Either a good one or an honest error with retry.

---

## Frontend Changes

### AdvisorResult.tsx — Component Updates

| Current Section | New Section | UI Change |
|---|---|---|
| "Recommended Tools" | "Agent Team" | Role badges (Copywriter, Designer) next to tool logos |
| "Step-by-Step Workflow" | "Scaffold" | Phase → action → output badge per row |
| "Prompt Templates" (multiple) | "Starter Prompt" (one) | Single prominent card with [PLACEHOLDER] highlighting + copy button |
| "Pro Tips" | "Keywords" | Clickable chips/tags |
| "Watch Out For" | "Level Up" | Callout banner with graduation icon |
| — | Difficulty badge | Color-coded next to title (green/yellow/red) |

### Type Updates (AdvisorData)

```typescript
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
```

---

## Files to Modify

| File | Change |
|---|---|
| `src/lib/prompts.ts` | Replace `WORKFLOW_SUGGEST_ENHANCED_PROMPT` with new prompt + 1-shot example |
| `src/app/api/workflows/suggest/route.ts` | New validation logic (Tier 1-3), updated response shape, reduce `maxTokens` to 2048 |
| `src/components/workflows/AdvisorResult.tsx` | New types, agent team UI, scaffold UI, starter prompt card, keywords, levelUp |
| `src/components/workflows/WorkflowShowcase.tsx` | Update `AdvisorData` import (type change only) |

---

## Research Context (2026 Trends)

This design is informed by current industry practices:

- **Multi-agent teams outperform single-agent by 90%+** on complex tasks — the agent-team framing matches how professionals actually use AI in 2026 ([Source](https://thesmarketers.com/blogs/ai-agentic-workflows-marketing/))
- **Role-based AI assignment** is the dominant pattern — one agent per specialist function ([Source](https://www.mindstudio.ai/blog/ai-agents-for-marketing-teams/))
- **Concrete deliverables per step** is a best practice from content workflow templates — "3 headline variants" not "generate headlines" ([Source](https://trustypost.ai/blog/social-media-content-creation-template-2026-the-5-step-workflow-i-use-copy-paste-sop/))
- **Keyword scaffolding** helps users build vocabulary for self-directed learning ([Source](https://www.gend.co/blog/ai-prompts-for-marketing-2026))
- **Quality validation before display** follows AI UX principles — confidence indicators and transparency build trust ([Source](https://www.uxstudioteam.com/ux-blog/ai-ux-5f836))
