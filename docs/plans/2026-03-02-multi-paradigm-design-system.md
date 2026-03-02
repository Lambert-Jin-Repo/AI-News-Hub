# Multi-Paradigm Design System for AI News Hub

**Date:** 2026-03-02
**Status:** Approved
**Approach:** Hybrid (CSS Variables + Selective Component Variants)

## Goal

Implement four switchable design paradigms across all pages of AI News Hub, with a dev-mode cycle button. Each paradigm represents a distinct visual philosophy from the Theme Lab reference (theme-lab.vercel.app). Enhance UX with scroll-driven animations and view transitions.

## Paradigms

1. **Glass** — Glassmorphism + Liquid Glass: frosted translucency, backdrop blur, gradient backgrounds
2. **M3E** — Material 3 Expressive: tonal surfaces, squircle shapes, spring-physics motion, dynamic color
3. **Brutalist** — Neubrutalism: 3px black borders, hard offset shadows, saturated colors, monospace accents
4. **Bento** — Bento Grid + Aurora Gradients: asymmetric grid layouts, mesh gradient backgrounds, soft neutral cells

## Architecture

### Paradigm x Theme Composition

Two independent axes: paradigm (glass/m3e/brutalist/bento) x theme (light/dark) = 8 combinations.

- `data-paradigm` attribute on `<html>` controls paradigm
- `.dark` class (existing next-themes) controls light/dark
- Both compose via CSS custom properties

### Token System (globals.css)

Each paradigm defines a complete token set under `[data-paradigm="<name>"]`:

| Category | Variables |
|---|---|
| Surface | `--surface`, `--surface-elevated`, `--surface-opacity` |
| Border | `--border-width`, `--border-color`, `--border-style`, `--card-radius` |
| Shadow | `--shadow-card`, `--shadow-card-hover` |
| Blur | `--backdrop-blur` |
| Motion | `--transition-duration`, `--transition-easing` |
| Typography | `--font-heading-weight`, `--heading-tracking` |
| Accent | `--accent-gradient`, `--accent-solid` |

Dark variants override under `[data-paradigm="<name>"].dark`.

### Token Values Per Paradigm

**Glass (light):**
- `--surface: rgba(255,255,255,0.25)`
- `--backdrop-blur: 16px`
- `--border-width: 1px`, `--border-color: rgba(255,255,255,0.35)`
- `--card-radius: 16px`
- `--shadow-card: none`
- `--accent-gradient: linear-gradient(135deg, #667eea, #764ba2)`
- `--font-heading-weight: 600`

**M3E (light):**
- `--surface: #FFFBFE`
- `--backdrop-blur: 0`
- `--border-width: 0`, `--card-radius: 28px`
- `--shadow-card: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)` (elevation 1)
- `--shadow-card-hover: 0 4px 8px rgba(0,0,0,0.12)` (elevation 3)
- `--transition-easing: cubic-bezier(0.34, 1.56, 0.64, 1)` (spring)
- `--font-heading-weight: 500`

**Brutalist (light):**
- `--surface: #FFFFFF`
- `--backdrop-blur: 0`
- `--border-width: 3px`, `--border-color: #000000`, `--border-style: solid`
- `--card-radius: 4px`
- `--shadow-card: 4px 4px 0 #000`
- `--shadow-card-hover: 6px 6px 0 #000`
- `--accent-solid: #FF6B9D`
- `--font-heading-weight: 900`
- `--heading-tracking: -0.02em`

**Bento (light):**
- `--surface: #f5f5f5`
- `--backdrop-blur: 0`
- `--border-width: 1px`, `--border-color: rgba(0,0,0,0.08)`
- `--card-radius: 16px`
- `--shadow-card: 0 1px 2px rgba(0,0,0,0.04)`
- `--accent-gradient: mesh gradient (CSS radial-gradient composition)`
- `--font-heading-weight: 700`

## Components

### ParadigmProvider (new)

- Client component wrapping the app (inside ThemeProvider)
- React context providing `{ paradigm, setParadigm, cycleParadigm }`
- Sets `data-paradigm` on `document.documentElement`
- Persists to localStorage key `paradigm`
- Default paradigm: none (uses existing design as baseline)

### ParadigmSwitcher (new, dev-only)

- Floating button, bottom-right, visible only in development
- Shows current paradigm icon + name
- Click cycles: Glass -> M3E -> Brutalist -> Bento -> (default) -> Glass
- Animated transition between paradigms (fade swap)

### Component Variants (3 total, all for Bento)

1. **Homepage layout** (`src/app/page.tsx`)
   - Default: 8/4 grid
   - Bento: asymmetric 5-cell grid (hero=2x2, audio=1x1, tool=1x1, terminology=1x1, stats integrated)

2. **Card grid** (`NewsCard`, `ToolCard` grid containers)
   - Default: uniform 3-column grid
   - Bento: CSS grid with `grid-template-rows: masonry` or varied `span` classes

3. **Digest timeline** (`digest-timeline.tsx`)
   - Default: vertical timeline
   - Bento: cards in bento grid layout

### Existing Components (CSS-only changes via tokens)

All other components adapt automatically through CSS custom properties:
- `NewsCard`, `ToolCard`, `DigestCard`, `DailyWordCard` — surface, border, shadow, radius
- `Header` — surface, border, backdrop-blur
- `DailyBriefingHero` — surface, border, accent gradient
- `AudioPlayerCard`, `FeaturedToolCard` — surface, border
- `FilterBar`, `SearchInput` — border, radius
- `Badge` — border, radius, accent color
- `Footer` — surface, border

## Scroll-Driven Animations

All implemented in pure CSS, no JavaScript.

### Entrance Animations (animation-timeline: view())
- **Cards**: fade-in + slide-up 20px, `animation-range: entry 0% entry 100%`
- **Section headings**: fade-in + scale 0.96->1
- **Stats counters**: fade-in

### Scroll Progress (animation-timeline: scroll())
- **Page progress bar**: thin line at top of viewport, grows with scroll position
- **Hero parallax**: background blur blob moves with scroll

### Graceful Degradation
- `@supports (animation-timeline: view())` wraps all scroll-driven rules
- Unsupported browsers see elements without animation (static)

## View Transitions API

### Route Transitions
- Custom `<TransitionLink>` component wrapping Next.js `<Link>`
- Uses `document.startViewTransition()` for cross-fade between pages (300ms)
- Falls back to instant navigation in unsupported browsers

### Element Morphing
- News card thumbnail gets `view-transition-name: article-thumb-{id}`
- Detail page hero image gets matching name
- Browser auto-morphs between them during transition

### Paradigm/Theme Switching
- Keeps existing circle-expand animation (no change)

## File Changes Summary

### New Files
- `src/components/providers/ParadigmProvider.tsx` — context + attribute management
- `src/components/ui/ParadigmSwitcher.tsx` — dev-only cycle button
- `src/components/ui/TransitionLink.tsx` — view transition wrapper

### Modified Files
- `src/app/globals.css` — paradigm token blocks, scroll animation keyframes, view transition CSS
- `src/app/layout.tsx` — wrap with ParadigmProvider
- `src/app/page.tsx` — bento layout variant
- `src/app/news/page.tsx` — bento grid variant
- `src/app/digests/digest-timeline.tsx` — bento variant
- `src/components/cards/NewsCard.tsx` — use token-based classes instead of hardcoded values
- `src/components/cards/ToolCard.tsx` — same
- `src/components/layout/Header.tsx` — use token-based classes
- `src/components/home/DailyBriefingHero.tsx` — use token-based classes
- Various other card/UI components — migrate hardcoded colors to CSS variables

### No Changes
- API routes — no visual components
- lib/ utilities — no visual components
- ThemeProvider — paradigm is independent, no changes needed

## Non-Goals

- No accessibility paradigm (separate concern, already handled)
- No Fluent 2 / Mica (too close to Glass, not distinct enough)
- No Neumorphism (poor contrast, accessibility concerns)
- Paradigm switcher is dev-only (not a user-facing feature in production)
- No container queries or :has() selector (not selected for this iteration)
