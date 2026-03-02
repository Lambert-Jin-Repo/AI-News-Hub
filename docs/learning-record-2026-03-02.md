# Learning Record — 2 Mar 2026

> Multi-paradigm design system: brainstormed, planned, and implemented 4 switchable visual paradigms across the entire AI News Hub site using CSS custom properties, scroll-driven animations, and View Transitions API.

---

## 📋 What Was Done (18 commits)

| # | Commit | Category |
|---|--------|----------|
| 1 | Add ParadigmProvider context with localStorage persistence | Architecture |
| 2 | Add dev-only ParadigmSwitcher floating button | Feature |
| 3 | Add paradigm CSS token system for all 4 paradigms (light + dark) | Design System |
| 4 | Migrate NewsCard to paradigm-aware token classes | Refactor |
| 5 | Migrate Header to paradigm-aware tokens | Refactor |
| 6 | Migrate DailyBriefingHero to paradigm tokens | Refactor |
| 7 | Migrate home section cards to paradigm tokens | Refactor |
| 8 | Migrate digest components to paradigm tokens | Refactor |
| 9 | Migrate all remaining components to paradigm tokens | Refactor |
| 10 | Add paradigm-specific page background gradients | Design System |
| 11 | Add bento layout variant for homepage hero and news grid | Layout |
| 12 | Add bento layout variants for news feed and digest timeline | Layout |
| 13 | Add scroll-driven animations and progress bar | UX |
| 14 | Add TransitionLink with View Transitions API support | UX |
| 15 | Add per-paradigm visual polish (brutalist hover, glass shimmer, M3E press) | Design System |
| 16 | Adopt TransitionLink for smooth route transitions | Refactor |
| 17 | Unify news + tools grids with shared card-grid bento layout | Layout |
| 18 | Make ParadigmSwitcher production-ready + replace all hardcoded colors | Production |

**Scale**: ~1,100 lines added/changed across 46 files.

---

## 🏗️ Architecture Decisions

### 1. Hybrid CSS Variables + Selective Component Variants

**Approach**: 90% of paradigm switching is driven by CSS custom properties (`--surface`, `--border`, `--card-radius`, `--shadow-card`, etc.) set via `[data-paradigm="name"]` selectors. Only the Bento paradigm uses additional CSS class variants for grid layout changes.

**Why**: Pure CSS variables can't change `grid-template-columns` meaningfully, but they handle colors, radii, shadows, and typography perfectly. The hybrid approach keeps component code clean while allowing structural layout changes for Bento.

**Key files**:
- `src/components/providers/ParadigmProvider.tsx` — React context, localStorage, `data-paradigm` on `<html>`
- `src/app/globals.css` — All token definitions (8 combos: 4 paradigms × light/dark)

### 2. Paradigm × Theme Composition

**Design**: Two independent axes — paradigm (glass/m3e/brutalist/bento) and theme (light/dark) — compose orthogonally. Each paradigm has both light and dark token sets. This means 8 total visual combinations.

**Implementation**: `[data-paradigm="glass"]` sets light tokens; `.dark[data-paradigm="glass"]` overrides with dark tokens. The `data-paradigm` attribute and `.dark` class are managed by separate providers (ParadigmProvider and next-themes).

### 3. Utility CSS Classes Over Component Variants

**Pattern**: Created `.paradigm-card`, `.paradigm-heading`, `.card-grid`, `.scroll-reveal` utility classes in globals.css. Components use these classes instead of having paradigm-specific props.

**Benefit**: Adding a new paradigm requires only editing globals.css — no component code changes needed.

---

## 📁 Files Changed (46 total)

### New Files (4)
- `src/components/providers/ParadigmProvider.tsx` — Paradigm state management
- `src/components/ui/ParadigmSwitcher.tsx` — Dropdown paradigm selector in Header
- `src/components/ui/TransitionLink.tsx` — View Transitions API wrapper for Next.js Link
- `docs/plans/2026-03-02-multi-paradigm-design-system.md` — Design document
- `docs/plans/2026-03-02-multi-paradigm-implementation.md` — 18-task implementation plan

### Major Changes
- `src/app/globals.css` — +450 lines of paradigm tokens, bento layouts, scroll animations, view transitions
- `src/app/layout.tsx` — Added ParadigmProvider, scroll-progress bar, paradigm-page-bg class
- `src/components/layout/Header.tsx` — ParadigmSwitcher + TransitionLink + CSS variable colors

### Color Migration (35 files)
All hardcoded `text-[#0d1b1a]`, `dark:text-white`, `dark:text-gray-*`, `dark:bg-gray-*`, `dark:border-gray-*` patterns replaced with:
- `text-[var(--foreground)]` — primary text
- `text-[var(--muted-foreground)]` — secondary text
- `bg-[var(--surface)]` — surface backgrounds
- `border-[var(--border)]` — borders

---

## 🔑 Key Takeaways

1. **CSS custom properties are powerful for theming**: One set of variables drives an entire paradigm change across 46 files without touching component logic
2. **Composition over conditionals**: Independent axes (paradigm + theme) compose cleanly when each controls its own dimension
3. **Utility classes bridge the gap**: When CSS variables can't express layout changes (grid columns), utility classes with `[data-paradigm]` selectors fill the gap
4. **Scroll-driven animations degrade gracefully**: Using `@supports (animation-timeline: view())` ensures browsers without support just skip the animation
5. **Replace hardcoded colors early**: Leaving `dark:text-gray-400` scattered across 35 files creates a large migration debt — use CSS variables from the start
6. **Subagent-driven development works well for large refactors**: 18 tasks executed via fresh subagents with spec + quality reviews caught issues early
