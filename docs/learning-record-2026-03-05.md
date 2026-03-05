# Learning Record — 5 Mar 2026

> Session 6: Designed Workflow Advisor v2 — "Agent Team Blueprint" (design doc only).
> Session 7: Implemented Workflow Advisor v2 — new prompt, 3-tier quality gates, new frontend UI.

---

## 📋 What Was Done

### Session 6 — Design (1 file created, 2 files updated)

| # | Change | Category |
|---|--------|----------|
| 1 | Wrote `docs/plans/2026-03-05-workflow-advisor-v2-design.md` | Design |
| 2 | Updated `project-tracker.md` — Phase 8 status | Docs |
| 3 | Updated `feature-update.md` — Added Phase 6 section | Docs |

### Session 7 — Implementation (3 files modified)

| # | Change | Category |
|---|--------|----------|
| 1 | Replaced `WORKFLOW_SUGGEST_ENHANCED_PROMPT` with "AI workflow architect" prompt + 1-shot example | Prompt |
| 2 | Rewrote `suggest/route.ts` — Tier 1-3 validation, retry chain, new response shape, `maxTokens: 2048` | API |
| 3 | Rewrote `AdvisorResult.tsx` — New types (`AdvisorAgent`, `AdvisorScaffoldStep`, `AdvisorData`), full UI rebuild | Frontend |
| 4 | Updated all tracker files (project-tracker, feature-update, design doc, learning record) | Docs |

**Scale**: ~450 lines changed across 3 source files + 4 docs files.

---

## 🏗️ Architecture Decisions

### 1. Agent Team Mental Model over Generic Tool List

**Before**: `tools[]` with name/role — tools as a flat list.
**After**: `agentTeam[]` with role/tool/slug/brief — tools framed as a specialist team where each "agent" has a job title.

**Why**: 2026 multi-agent workflows are the dominant pattern. Framing each tool as a team member with a clear brief is more intuitive and matches how professionals actually use AI tool chains.

### 2. One Great Prompt over Multiple Mediocre Ones

**Before**: `promptTemplates[]` (1-3 prompts) — quantity varied, quality inconsistent.
**After**: `starterPrompt` (exactly 1) with `[PLACEHOLDER]` tokens the user fills in.

**Why**: One high-quality, ready-to-use prompt with clear personalization slots is more actionable than 2-3 generic prompts. The `[PLACEHOLDER]` pattern also enables client-side highlighting.

### 3. Quality Gates as a First-Class Backend Feature

**Before**: Minimal validation — just check if `title` and `steps` exist.
**After**: 3-tier validation:
- **Tier 1 (Schema)**: All required fields, correct array counts, `[PLACEHOLDER]` in prompt, difficulty enum, levelUp length bounds
- **Tier 2 (Content)**: No duplicate text between fields, distinct scaffold outputs, min prompt length, goal keyword relevance, no duplicate role+tool agents
- **Tier 3 (Retry)**: Same provider retry → fallback to next provider in chain → honest error

**Why**: "Never show the user a bad answer." LLM output quality varies — validation + retry produces consistently good results or an honest error, never garbage.

### 4. Token Reduction via Schema Redesign

**Before**: ~790 output tokens (tips, pitfalls, multiple prompt templates = filler).
**After**: ~432 output tokens (keywords, levelUp, single starterPrompt = denser information).

**Savings**: ~45% output token reduction. `maxTokens` reduced from 4096 to 2048 — still generous for the new schema, accounts for MiniMax M2.5 `<think>` block overhead.

---

## 🔧 Implementation Details

### Prompt Design: 1-Shot Example

Added a full landing page example (~150 tokens) after the rules block in the system prompt. This anchors the LLM's output quality — without it, the model often produces vague scaffolds like "Generate content" instead of concrete deliverables like "3 headline variants + 150-word hero".

### Tier 3 Retry Strategy

```typescript
const providers: Array<'minimax' | 'default'> = ['minimax', 'minimax', 'default'];
```

Attempt 0: MiniMax (primary) → Attempt 1: MiniMax retry → Attempt 2: Gemini fallback. If all 3 fail validation, return an honest error. This reuses the existing `generateText()` chain mechanism — no new infrastructure.

### [PLACEHOLDER] Highlighting

Client-side regex splits the starter prompt text at `[BRACKET]` patterns and wraps matches in `<span className="font-bold text-primary">`. No dangerouslySetInnerHTML — uses React children array.

### Keywords as Clickable Chips

Each keyword links to a Google search: `https://www.google.com/search?q=${encodeURIComponent(kw)}`. This supports the "keyword scaffolding" learning pattern — users can self-direct their learning by clicking terms they don't recognize.

---

## 📁 Files Changed

| File | Change |
|------|--------|
| `src/lib/prompts.ts` | Replaced `WORKFLOW_SUGGEST_ENHANCED_PROMPT` — new prompt + 1-shot example |
| `src/app/api/workflows/suggest/route.ts` | Tier 1-3 validation, retry chain, new response shape, `maxTokens: 2048` |
| `src/components/workflows/AdvisorResult.tsx` | New types + full UI rebuild (agent team, scaffold, starter prompt, keywords, level up, difficulty) |
| `docs/planning/project-tracker.md` | Phase 8 added, agent log Session 7 entry |
| `docs/planning/feature-update.md` | Phase 6 status → Implementation Complete |
| `docs/plans/2026-03-05-workflow-advisor-v2-design.md` | Status → Implemented |

---

## 🔑 Key Takeaways

1. **LLM output validation is cheap and high-value**: Tier 1+2 checks are pure code (no extra API calls) and catch most bad outputs. Adding retry on failure costs one extra LLM call at most — far better than showing garbage to users.

2. **Schema redesign > prompt tuning for token efficiency**: Changing _what_ you ask the LLM to produce (fewer fields, denser information) saved more tokens than any prompt wording optimization could.

3. **1-shot examples anchor quality more than rules do**: The example in the system prompt (~150 tokens) produces higher-quality output than pages of rules alone. The model pattern-matches to concrete examples.

4. **WorkflowShowcase needed zero changes**: Because the type name `AdvisorData` was kept the same (only its shape changed), the parent component's import didn't need updating — TypeScript structural typing handles the rest.

5. **Retry chain reuses existing infrastructure**: The `generateText()` function already supports `provider` switching. The retry loop just calls it with different `provider` values — no new retry library or abstraction needed.
