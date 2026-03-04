# Multi-Paradigm Design System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four switchable visual paradigms (Glass, M3E, Brutalist, Bento) across all AI News Hub pages with scroll-driven animations and view transitions.

**Architecture:** Hybrid approach — CSS custom properties under `[data-paradigm]` selectors handle 90% of the visual changes. A `ParadigmProvider` context manages state and a dev-only `ParadigmSwitcher` cycles paradigms. Three component variants handle Bento-specific layout restructuring. Scroll-driven animations and View Transitions API enhance UX across all paradigms.

**Tech Stack:** Next.js 16 / React 19, Tailwind CSS 4, CSS custom properties, `animation-timeline: view()`, `document.startViewTransition()`, Framer Motion (existing).

**Design doc:** `docs/plans/2026-03-02-multi-paradigm-design-system.md`

---

## Task 1: ParadigmProvider — Context & Data Attribute

**Files:**
- Create: `src/components/providers/ParadigmProvider.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create ParadigmProvider**

Create `src/components/providers/ParadigmProvider.tsx`:

```tsx
"use client";

import * as React from "react";

const PARADIGMS = ["glass", "m3e", "brutalist", "bento"] as const;
export type Paradigm = (typeof PARADIGMS)[number] | null;

interface ParadigmContextValue {
  paradigm: Paradigm;
  setParadigm: (p: Paradigm) => void;
  cycleParadigm: () => void;
}

const ParadigmContext = React.createContext<ParadigmContextValue>({
  paradigm: null,
  setParadigm: () => {},
  cycleParadigm: () => {},
});

export function useParadigm() {
  return React.useContext(ParadigmContext);
}

export { PARADIGMS };

export function ParadigmProvider({ children }: { children: React.ReactNode }) {
  const [paradigm, setParadigmState] = React.useState<Paradigm>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("paradigm");
    if (stored && PARADIGMS.includes(stored as typeof PARADIGMS[number])) {
      setParadigmState(stored as Paradigm);
    }
  }, []);

  // Sync data-paradigm attribute on <html>
  React.useEffect(() => {
    if (paradigm) {
      document.documentElement.setAttribute("data-paradigm", paradigm);
      localStorage.setItem("paradigm", paradigm);
    } else {
      document.documentElement.removeAttribute("data-paradigm");
      localStorage.removeItem("paradigm");
    }
  }, [paradigm]);

  const setParadigm = React.useCallback((p: Paradigm) => {
    setParadigmState(p);
  }, []);

  const cycleParadigm = React.useCallback(() => {
    setParadigmState((current) => {
      if (current === null) return PARADIGMS[0];
      const idx = PARADIGMS.indexOf(current);
      if (idx === PARADIGMS.length - 1) return null; // cycle back to default
      return PARADIGMS[idx + 1];
    });
  }, []);

  const value = React.useMemo(
    () => ({ paradigm, setParadigm, cycleParadigm }),
    [paradigm, setParadigm, cycleParadigm],
  );

  return (
    <ParadigmContext.Provider value={value}>
      {children}
    </ParadigmContext.Provider>
  );
}
```

**Step 2: Wire into layout**

In `src/app/layout.tsx`, add `ParadigmProvider` inside `ThemeProvider`:

```tsx
// Add import at top:
import { ParadigmProvider } from "@/components/providers/ParadigmProvider";

// Wrap children inside ThemeProvider:
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <ParadigmProvider>
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">{children}</div>
      <Footer />
    </div>
    <FloatingControls />
  </ParadigmProvider>
</ThemeProvider>
```

**Step 3: Verify it compiles**

Run: `cd "/Users/liangbojin/Desktop/MyProject/AI News Station/ai-news-hub" && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (or only pre-existing warnings).

**Step 4: Commit**

```bash
git add src/components/providers/ParadigmProvider.tsx src/app/layout.tsx
git commit -m "feat: add ParadigmProvider context with localStorage persistence"
```

---

## Task 2: ParadigmSwitcher — Dev-Only Floating Button

**Files:**
- Create: `src/components/ui/ParadigmSwitcher.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create ParadigmSwitcher**

Create `src/components/ui/ParadigmSwitcher.tsx`:

```tsx
"use client";

import { useParadigm, PARADIGMS, type Paradigm } from "@/components/providers/ParadigmProvider";
import { Palette } from "lucide-react";

const PARADIGM_LABELS: Record<string, string> = {
  glass: "Glass",
  m3e: "M3E",
  brutalist: "Brutal",
  bento: "Bento",
};

const PARADIGM_COLORS: Record<string, string> = {
  glass: "#667eea",
  m3e: "#6750A4",
  brutalist: "#FF6B9D",
  bento: "#4ECDC4",
};

export function ParadigmSwitcher() {
  const { paradigm, cycleParadigm } = useParadigm();

  // Only show in development
  if (process.env.NODE_ENV !== "development") return null;

  const label = paradigm ? PARADIGM_LABELS[paradigm] : "Default";
  const dotColor = paradigm ? PARADIGM_COLORS[paradigm] : "#0d968b";

  return (
    <button
      onClick={cycleParadigm}
      className="fixed bottom-8 right-24 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-sm font-medium text-[var(--foreground)]"
      title={`Current paradigm: ${label}. Click to cycle.`}
      aria-label={`Design paradigm: ${label}. Click to switch.`}
    >
      <span
        className="w-3 h-3 rounded-full shrink-0 transition-colors duration-200"
        style={{ backgroundColor: dotColor }}
      />
      <Palette className="w-4 h-4 opacity-60" />
      <span>{label}</span>
    </button>
  );
}
```

**Step 2: Add to layout**

In `src/app/layout.tsx`, add import and render alongside `FloatingControls`:

```tsx
// Add import:
import { ParadigmSwitcher } from "@/components/ui/ParadigmSwitcher";

// Add after FloatingControls:
<FloatingControls />
<ParadigmSwitcher />
```

**Step 3: Verify locally**

Run: `cd "/Users/liangbojin/Desktop/MyProject/AI News Station/ai-news-hub" && npm run dev`
Expected: Floating button visible bottom-right showing "Default". Clicking cycles through Glass/M3E/Brutal/Bento/Default. The `data-paradigm` attribute should update on `<html>` (inspect in DevTools).

**Step 4: Commit**

```bash
git add src/components/ui/ParadigmSwitcher.tsx src/app/layout.tsx
git commit -m "feat: add dev-only ParadigmSwitcher floating button"
```

---

## Task 3: CSS Token System — All 4 Paradigms (Light + Dark)

**Files:**
- Modify: `src/app/globals.css`

This is the largest single task — defining the complete token set for all 8 combinations (4 paradigms x 2 themes).

**Step 1: Add paradigm token blocks to globals.css**

Append the following after the existing `@layer base { ... }` block (after line 50) in `src/app/globals.css`:

```css
/* ── Paradigm Design Tokens ── */

/* Glass — Glassmorphism + Liquid Glass */
[data-paradigm="glass"] {
  --surface: rgba(255, 255, 255, 0.25);
  --surface-elevated: rgba(255, 255, 255, 0.4);
  --border: rgba(255, 255, 255, 0.35);
  --border-width: 1px;
  --border-style: solid;
  --card-radius: 16px;
  --shadow-card: none;
  --shadow-card-hover: none;
  --backdrop-blur: 16px;
  --transition-duration: 300ms;
  --transition-easing: ease;
  --font-heading-weight: 600;
  --heading-tracking: normal;
  --accent-gradient: linear-gradient(135deg, #667eea, #764ba2);
  --accent-solid: #667eea;
  --page-bg-extra: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
}

[data-paradigm="glass"].dark {
  --surface: rgba(16, 34, 32, 0.4);
  --surface-elevated: rgba(16, 34, 32, 0.6);
  --border: rgba(255, 255, 255, 0.1);
  --background: #0a1a18;
  --page-bg-extra: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
}

/* M3E — Material 3 Expressive */
[data-paradigm="m3e"] {
  --surface: #FFFBFE;
  --surface-elevated: #F6F2F7;
  --border: transparent;
  --border-width: 0px;
  --border-style: none;
  --card-radius: 28px;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);
  --backdrop-blur: 0px;
  --transition-duration: 300ms;
  --transition-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
  --font-heading-weight: 500;
  --heading-tracking: normal;
  --accent-gradient: linear-gradient(135deg, #6750A4, #9A82DB);
  --accent-solid: #6750A4;
  --page-bg-extra: none;
  --foreground: #1C1B1F;
  --muted-foreground: #49454F;
}

[data-paradigm="m3e"].dark {
  --surface: #1C1B1F;
  --surface-elevated: #2B2930;
  --background: #141218;
  --foreground: #E6E1E5;
  --muted-foreground: #CAC4D0;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-card-hover: 0 4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Brutalist — Neubrutalism */
[data-paradigm="brutalist"] {
  --surface: #FFFFFF;
  --surface-elevated: #FFFFFF;
  --border: #000000;
  --border-width: 3px;
  --border-style: solid;
  --card-radius: 4px;
  --shadow-card: 4px 4px 0 #000;
  --shadow-card-hover: 6px 6px 0 #000;
  --backdrop-blur: 0px;
  --transition-duration: 150ms;
  --transition-easing: steps(3);
  --font-heading-weight: 900;
  --heading-tracking: -0.02em;
  --accent-gradient: none;
  --accent-solid: #FF6B9D;
  --page-bg-extra: none;
  --background: #FFF8E7;
  --foreground: #000000;
  --muted-foreground: #333333;
}

[data-paradigm="brutalist"].dark {
  --surface: #1a1a2e;
  --surface-elevated: #222240;
  --background: #0f0f23;
  --border: #FFE66D;
  --foreground: #FFFFFF;
  --muted-foreground: #cccccc;
  --shadow-card: 4px 4px 0 #FFE66D;
  --shadow-card-hover: 6px 6px 0 #FFE66D;
  --accent-solid: #FF6B9D;
}

/* Bento — Bento Grid + Aurora Gradients */
[data-paradigm="bento"] {
  --surface: #f5f5f5;
  --surface-elevated: #FFFFFF;
  --border: rgba(0, 0, 0, 0.08);
  --border-width: 1px;
  --border-style: solid;
  --card-radius: 16px;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 2px 8px rgba(0, 0, 0, 0.08);
  --backdrop-blur: 0px;
  --transition-duration: 400ms;
  --transition-easing: ease-out;
  --font-heading-weight: 700;
  --heading-tracking: -0.01em;
  --accent-gradient: radial-gradient(ellipse at 20% 50%, rgba(78, 205, 196, 0.3), transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(118, 75, 162, 0.2), transparent 50%),
    radial-gradient(ellipse at 40% 80%, rgba(255, 107, 107, 0.15), transparent 50%);
  --accent-solid: #4ECDC4;
  --page-bg-extra: radial-gradient(ellipse at 20% 50%, rgba(78, 205, 196, 0.06), transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(118, 75, 162, 0.04), transparent 50%);
}

[data-paradigm="bento"].dark {
  --surface: #1a1a1a;
  --surface-elevated: #242424;
  --background: #111111;
  --border: rgba(255, 255, 255, 0.08);
  --foreground: #f0f0f0;
  --muted-foreground: #999999;
}
```

**Step 2: Add utility classes that consume paradigm tokens**

Add these utility classes after the paradigm token blocks:

```css
/* ── Paradigm-Aware Utility Classes ── */

/* Card base — adapts to current paradigm */
.paradigm-card {
  background: var(--surface);
  border: var(--border-width, 1px) var(--border-style, solid) var(--border);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--shadow-card, var(--shadow-soft));
  backdrop-filter: blur(var(--backdrop-blur, 0px));
  transition: box-shadow var(--transition-duration, 300ms) var(--transition-easing, ease),
    transform var(--transition-duration, 300ms) var(--transition-easing, ease);
}

.paradigm-card:hover {
  box-shadow: var(--shadow-card-hover, var(--shadow-soft-hover));
}

/* Section heading — adapts weight and tracking */
.paradigm-heading {
  font-weight: var(--font-heading-weight, 700);
  letter-spacing: var(--heading-tracking, normal);
}

/* Page background overlay for paradigms with special backgrounds */
.paradigm-page-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--page-bg-extra, none);
  pointer-events: none;
  z-index: -1;
}
```

**Step 3: Verify the CSS parses correctly**

Run: `cd "/Users/liangbojin/Desktop/MyProject/AI News Station/ai-news-hub" && npm run dev 2>&1 | head -10`
Expected: Dev server starts without CSS parse errors.

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add paradigm CSS token system for all 4 paradigms (light + dark)"
```

---

## Task 4: Migrate NewsCard to Paradigm Tokens

**Files:**
- Modify: `src/components/cards/NewsCard.tsx`

**Step 1: Replace hardcoded card styles with paradigm-aware classes**

In `src/components/cards/NewsCard.tsx`, replace the `cardClassName` constant (line 100-101):

Old:
```tsx
const cardClassName =
  "bg-[var(--surface)] rounded-[16px] p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 flex gap-5 group cursor-pointer border border-transparent hover:border-primary/20 no-underline focus:outline-none focus:ring-2 focus:ring-primary/50";
```

New:
```tsx
const cardClassName =
  "paradigm-card p-5 flex gap-5 group cursor-pointer no-underline focus:outline-none focus:ring-2 focus:ring-primary/50";
```

**Step 2: Verify visually**

Run dev server, check that NewsCard still looks correct with no paradigm selected (uses default CSS variable values from `:root`). Then cycle through paradigms with the switcher — cards should change border, radius, shadow.

**Step 3: Commit**

```bash
git add src/components/cards/NewsCard.tsx
git commit -m "refactor: migrate NewsCard to paradigm-aware token classes"
```

---

## Task 5: Migrate Header to Paradigm Tokens

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Step 1: Update nav background to use paradigm tokens**

In `src/components/layout/Header.tsx`, line 25, replace:

Old:
```tsx
<nav className="sticky top-0 z-50 w-full bg-[var(--surface)]/90 backdrop-blur-md border-b border-[#e7f3f2] dark:border-[#2A3E3C]">
```

New:
```tsx
<nav className="sticky top-0 z-50 w-full border-b border-[var(--border)]" style={{ background: `var(--surface)`, backdropFilter: `blur(var(--backdrop-blur, 12px))`, opacity: 0.95 }}>
```

**Step 2: Verify navigation looks right across paradigms**

Check: Glass = translucent frosted header. Brutalist = thick bottom border. M3E = no border, elevated surface. Bento = subtle border.

**Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "refactor: migrate Header to paradigm-aware tokens"
```

---

## Task 6: Migrate DailyBriefingHero to Paradigm Tokens

**Files:**
- Modify: `src/components/home/DailyBriefingHero.tsx`

**Step 1: Update hero card container**

In `src/components/home/DailyBriefingHero.tsx`, line 24, replace:

Old:
```tsx
<div className="lg:col-span-8 bg-[var(--surface)] text-[var(--foreground)] rounded-xl border border-[var(--border)] p-6 relative overflow-hidden group">
```

New:
```tsx
<div className="lg:col-span-8 paradigm-card p-6 relative overflow-hidden group text-[var(--foreground)]">
```

**Step 2: Update heading weight**

Line 37, replace:
```tsx
<h1 className="text-4xl md:text-5xl font-bold leading-[1.15] mb-6">
```

With:
```tsx
<h1 className="text-4xl md:text-5xl paradigm-heading leading-[1.15] mb-6">
```

**Step 3: Commit**

```bash
git add src/components/home/DailyBriefingHero.tsx
git commit -m "refactor: migrate DailyBriefingHero to paradigm tokens"
```

---

## Task 7: Migrate StatsRow, AudioPlayerCard, FeaturedToolCard

**Files:**
- Modify: `src/components/home/StatsRow.tsx`
- Modify: `src/components/home/AudioPlayerCard.tsx`
- Modify: `src/components/home/FeaturedToolCard.tsx`

**Step 1: Update StatsRow**

In `src/components/home/StatsRow.tsx`, line 14, replace the outer div className:

Old:
```tsx
<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] py-6 px-8 flex flex-col md:flex-row justify-around items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
```

New:
```tsx
<div className="paradigm-card py-6 px-8 flex flex-col md:flex-row justify-around items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
```

**Step 2: Update AudioPlayerCard and FeaturedToolCard**

Apply the same pattern — find the outermost container div with `bg-[var(--surface)]` and `border` classes, replace with `paradigm-card`. Read each file first to find the exact line.

**Step 3: Commit**

```bash
git add src/components/home/StatsRow.tsx src/components/home/AudioPlayerCard.tsx src/components/home/FeaturedToolCard.tsx
git commit -m "refactor: migrate home section cards to paradigm tokens"
```

---

## Task 8: Migrate DigestTimeline + DigestCard

**Files:**
- Modify: `src/app/digests/digest-timeline.tsx`
- Modify: `src/components/cards/DigestCard.tsx`

**Step 1: Update digest timeline date navigation buttons**

In `src/app/digests/digest-timeline.tsx`, update the button and input classes to use `paradigm-card` for their surface/border:

Lines 141-142, replace:
```tsx
className="p-2 rounded-lg bg-[var(--surface)] shadow-soft hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
```

With:
```tsx
className="p-2 paradigm-card hover:opacity-80 cursor-pointer"
```

Do the same for the matching button on line 156 and the input on line 151.

**Step 2: Update DigestCard**

Read `src/components/cards/DigestCard.tsx` and replace hardcoded surface/border/radius with `paradigm-card`.

**Step 3: Commit**

```bash
git add src/app/digests/digest-timeline.tsx src/components/cards/DigestCard.tsx
git commit -m "refactor: migrate digest components to paradigm tokens"
```

---

## Task 9: Migrate Remaining Components (ToolCard, FilterBar, Footer, Badge, DailyWordCard, FloatingControls)

**Files:**
- Modify: `src/components/cards/ToolCard.tsx`
- Modify: `src/components/cards/DailyTerminologyCard.tsx`
- Modify: `src/components/cards/DailyWordCard.tsx` (if exists)
- Modify: `src/components/ui/FilterBar.tsx`
- Modify: `src/components/ui/SearchInput.tsx`
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/ui/FloatingControls.tsx`

**Step 1: For each component:**
1. Read the file
2. Find hardcoded `bg-[var(--surface)]`, `border-[var(--border)]`, `rounded-xl`, `shadow-soft` patterns
3. Replace outer container with `paradigm-card` class
4. Replace heading `font-bold` with `paradigm-heading` where applicable

**Step 2: Special handling for FloatingControls**

The scroll-to-top button should use paradigm accent color. Replace `bg-primary` with a style that respects the paradigm accent:

```tsx
className={cn(
    "p-3 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer",
    "bg-[var(--accent-solid,theme(colors.primary))] text-white hover:opacity-90",
    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
)}
```

**Step 3: Verify all components across paradigms**

Run dev server, cycle through all paradigms, visit every page. Check for:
- Consistent card styling per paradigm
- No broken borders or shadows
- Dark mode works for all paradigms

**Step 4: Commit**

```bash
git add src/components/
git commit -m "refactor: migrate all remaining components to paradigm tokens"
```

---

## Task 10: Page Background Enhancement

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Add paradigm page background class**

In `src/app/layout.tsx`, add `paradigm-page-bg` to the body or main container:

```tsx
<body
  className={`${manrope.variable} antialiased paradigm-page-bg`}
  suppressHydrationWarning
>
```

This renders the subtle background gradient defined per paradigm (Glass gets a purple-blue tint, Bento gets aurora gradients, others get none).

**Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add paradigm-specific page background gradients"
```

---

## Task 11: Bento Layout Variant — Homepage

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add a bento-aware grid wrapper**

The homepage currently uses `grid-cols-1 lg:grid-cols-12`. For the bento paradigm, we restructure into a 4-column asymmetric grid.

In `src/app/page.tsx`, replace the hero section grid (lines 131-147):

Old:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <DailyBriefingHero ... />
  <div className="lg:col-span-4 flex flex-col gap-6">
    <AudioPlayerCard digest={digest} />
    <FeaturedToolCard toolsCount={stats.tools} />
    <DailyTerminologyCard />
  </div>
</div>
```

New — add a CSS class that switches layout when `[data-paradigm="bento"]` is active:

```tsx
<div className="home-hero-grid gap-6">
  <DailyBriefingHero
    displayDate={displayDate}
    digestSections={digestSections}
    digest={digest}
    sectionIcons={SECTION_ICONS}
  />
  <div className="home-sidebar flex flex-col gap-6">
    <AudioPlayerCard digest={digest} />
    <FeaturedToolCard toolsCount={stats.tools} />
    <DailyTerminologyCard />
  </div>
</div>
```

Then add CSS in `globals.css`:

```css
/* ── Bento Layout Variant: Homepage ── */
.home-hero-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .home-hero-grid {
    grid-template-columns: repeat(12, 1fr);
  }

  .home-hero-grid > :first-child {
    grid-column: span 8;
  }

  .home-sidebar {
    grid-column: span 4;
  }
}

/* Bento variant: asymmetric layout */
[data-paradigm="bento"] .home-hero-grid {
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  [data-paradigm="bento"] .home-hero-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto auto;
  }

  [data-paradigm="bento"] .home-hero-grid > :first-child {
    grid-column: span 3;
    grid-row: span 2;
  }

  [data-paradigm="bento"] .home-sidebar {
    grid-column: span 1;
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    gap: 1rem;
  }
}
```

**Step 2: Add bento variant for the news cards grid**

In `src/app/page.tsx`, update the news grid (line 165):

Old:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

New:
```tsx
<div className="news-card-grid gap-6">
```

Add CSS:
```css
.news-card-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .news-card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .news-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Bento variant: varied cell sizes */
[data-paradigm="bento"] .news-card-grid {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  [data-paradigm="bento"] .news-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  [data-paradigm="bento"] .news-card-grid > :first-child {
    grid-column: span 2;
    grid-row: span 2;
  }
}
```

**Step 3: Verify bento layout**

Run dev server, switch to Bento paradigm, check homepage layout restructures correctly.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "feat: add bento layout variant for homepage hero and news grid"
```

---

## Task 12: Bento Layout Variant — News Feed + Digest Timeline

**Files:**
- Modify: `src/app/news/news-feed.tsx`
- Modify: `src/app/digests/digest-timeline.tsx`
- Modify: `src/app/globals.css`

**Step 1: Read news-feed.tsx to find the card grid**

Read `src/app/news/news-feed.tsx` and find the grid container for news cards. Apply same `news-card-grid` class pattern.

**Step 2: Add bento variant for digest timeline**

In `src/app/digests/digest-timeline.tsx`, the timeline (line 186) uses `border-l-2 ... ml-4 pl-8 space-y-8`. Wrap in a class:

```tsx
<div className="digest-timeline-layout">
```

Add CSS:
```css
/* Default: vertical timeline */
.digest-timeline-layout {
  border-left: 2px solid var(--border);
  margin-left: 1rem;
  padding-left: 2rem;
}

.digest-timeline-layout > * + * {
  margin-top: 2rem;
}

/* Bento variant: grid layout */
[data-paradigm="bento"] .digest-timeline-layout {
  border-left: none;
  margin-left: 0;
  padding-left: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

[data-paradigm="bento"] .digest-timeline-layout > * + * {
  margin-top: 0;
}

/* Hide timeline dots in bento mode */
[data-paradigm="bento"] .digest-timeline-layout .absolute {
  display: none;
}
```

**Step 3: Commit**

```bash
git add src/app/news/news-feed.tsx src/app/digests/digest-timeline.tsx src/app/globals.css
git commit -m "feat: add bento layout variants for news feed and digest timeline"
```

---

## Task 13: Scroll-Driven Animations

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/cards/NewsCard.tsx` (add class)
- Modify: `src/components/home/StatsRow.tsx` (add class)

**Step 1: Add scroll-driven animation CSS**

Append to `src/app/globals.css`:

```css
/* ── Scroll-Driven Animations ── */

@supports (animation-timeline: view()) {
  /* Card entrance: fade-in + slide-up */
  .scroll-reveal {
    animation: scroll-fade-up linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }

  @keyframes scroll-fade-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Section heading entrance: fade-in + scale */
  .scroll-reveal-heading {
    animation: scroll-scale-in linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 80%;
  }

  @keyframes scroll-scale-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Stagger delay utilities for cards in a grid */
  .scroll-reveal:nth-child(2) { animation-delay: 50ms; }
  .scroll-reveal:nth-child(3) { animation-delay: 100ms; }
  .scroll-reveal:nth-child(4) { animation-delay: 150ms; }
  .scroll-reveal:nth-child(5) { animation-delay: 200ms; }
  .scroll-reveal:nth-child(6) { animation-delay: 250ms; }
}

/* ── Scroll Progress Bar ── */
@supports (animation-timeline: scroll()) {
  .scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent-solid, var(--color-primary));
    transform-origin: left;
    z-index: 9999;
    animation: scroll-progress-grow linear both;
    animation-timeline: scroll();
  }

  @keyframes scroll-progress-grow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
}
```

**Step 2: Add scroll-reveal class to NewsCard**

In `src/components/cards/NewsCard.tsx`, add `scroll-reveal` to the card className:

```tsx
const cardClassName =
  "paradigm-card p-5 flex gap-5 group cursor-pointer no-underline focus:outline-none focus:ring-2 focus:ring-primary/50 scroll-reveal";
```

**Step 3: Add scroll-reveal-heading to section headings in page.tsx**

In `src/app/page.tsx`, line 155:
```tsx
<h2 className="text-2xl font-bold tracking-tight scroll-reveal-heading">Latest Headlines</h2>
```

**Step 4: Add scroll progress bar to layout**

In `src/app/layout.tsx`, add a progress bar div right after `<body>`:

```tsx
<body ...>
  <div className="scroll-progress" aria-hidden="true" />
  <ThemeProvider ...>
```

**Step 5: Commit**

```bash
git add src/app/globals.css src/components/cards/NewsCard.tsx src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add scroll-driven animations and progress bar"
```

---

## Task 14: View Transitions API — TransitionLink

**Files:**
- Create: `src/components/ui/TransitionLink.tsx`

**Step 1: Create TransitionLink component**

Create `src/components/ui/TransitionLink.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

type TransitionLinkProps = ComponentProps<typeof Link>;

export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the original onClick run first
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Only intercept left-clicks without modifier keys
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    const url = typeof href === "string" ? href : href.pathname ?? "/";

    // Use View Transition if supported
    if ("startViewTransition" in document) {
      (document as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        router.push(url);
      });
    } else {
      router.push(url);
    }
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
```

**Step 2: Add view transition CSS**

Append to `src/app/globals.css`:

```css
/* ── View Transitions ── */
::view-transition-old(root) {
  animation: fade-out 200ms ease-out;
}

::view-transition-new(root) {
  animation: fade-in 300ms ease-in;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Step 3: Commit**

```bash
git add src/components/ui/TransitionLink.tsx src/app/globals.css
git commit -m "feat: add TransitionLink with View Transitions API support"
```

---

## Task 15: Adopt TransitionLink in Key Navigation Points

**Files:**
- Modify: `src/components/cards/NewsCard.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Replace internal Links with TransitionLink**

In `src/components/cards/NewsCard.tsx`, replace the internal `<Link>` (line 119-125):

```tsx
import { TransitionLink } from "@/components/ui/TransitionLink";

// Replace: <Link href={url} ...>
// With:    <TransitionLink href={url} ...>
```

In `src/components/layout/Header.tsx`, replace nav `<Link>`s with `<TransitionLink>`.

In `src/app/page.tsx`, replace the "View Archive" and "Read Full Digest" links.

**Step 2: Add view-transition-name for article thumbnails**

In `src/components/cards/NewsCard.tsx`, add a `view-transition-name` to the thumbnail for morphing:

```tsx
<div
  className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
  style={{ viewTransitionName: `article-thumb` }}
>
```

Note: We use a generic name here. For proper per-article morphing, each card needs a unique name. This can be enhanced later by using slug-based names.

**Step 3: Verify transitions work**

Run dev server in Chrome (View Transitions are Chrome-only as of March 2026). Click nav links — should see a smooth cross-fade. Safari/Firefox fallback to instant navigation.

**Step 4: Commit**

```bash
git add src/components/cards/NewsCard.tsx src/components/layout/Header.tsx src/app/page.tsx
git commit -m "feat: adopt TransitionLink for smooth route transitions"
```

---

## Task 16: Visual Polish Pass — Per-Paradigm Fine-Tuning

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add brutalist-specific accent styling**

The brutalist paradigm should use a special "tagged" look for badges and CTAs:

```css
/* Brutalist accent overrides */
[data-paradigm="brutalist"] .paradigm-card:hover {
  transform: translate(-2px, -2px);
}

[data-paradigm="brutalist"] a,
[data-paradigm="brutalist"] button {
  transition-timing-function: steps(3);
}
```

**Step 2: Add glass-specific shimmer for surfaces**

```css
/* Glass shimmer on surfaces */
[data-paradigm="glass"] .paradigm-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  pointer-events: none;
}

[data-paradigm="glass"] .paradigm-card {
  position: relative;
}
```

**Step 3: Add M3E ripple hint on cards**

```css
/* M3E: subtle scale on press */
[data-paradigm="m3e"] .paradigm-card:active {
  transform: scale(0.98);
  transition-duration: 100ms;
}
```

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add per-paradigm visual polish (brutalist hover, glass shimmer, M3E press)"
```

---

## Task 17: Full Integration Test

**Files:** None (testing only)

**Step 1: Start dev server**

Run: `cd "/Users/liangbojin/Desktop/MyProject/AI News Station/ai-news-hub" && npm run dev`

**Step 2: Test matrix**

Manually verify every combination works:

| Page | Default | Glass Light | Glass Dark | M3E Light | M3E Dark | Brutal Light | Brutal Dark | Bento Light | Bento Dark |
|------|---------|------------|------------|-----------|----------|-------------|-------------|-------------|-------------|
| `/` (Home) | | | | | | | | | |
| `/news` | | | | | | | | | |
| `/tools` | | | | | | | | | |
| `/digests` | | | | | | | | | |
| `/daily-words` | | | | | | | | | |
| `/about` | | | | | | | | | |

For each cell, verify:
- Cards use correct border/shadow/radius
- Header styling is consistent
- Background gradient (if any) renders
- Scroll animations trigger
- View transitions work on navigation
- No broken layout or clipping

**Step 3: Check scroll-driven animations**

- Scroll down on homepage — cards should fade in
- Progress bar at top should grow

**Step 4: Check view transitions**

- Click news card → detail page: should cross-fade
- Click nav links: should cross-fade

**Step 5: Fix any issues found**

Address visual bugs as needed. Commit fixes.

---

## Task 18: Final Build Verification

**Files:** None

**Step 1: Run production build**

Run: `cd "/Users/liangbojin/Desktop/MyProject/AI News Station/ai-news-hub" && npx next build --no-lint 2>&1 | tail -20`
Expected: Build succeeds with no errors.

**Step 2: Run production preview**

Run: `npm start`
Verify: ParadigmSwitcher is NOT visible (production mode). All paradigms still work via localStorage (can set manually in DevTools).

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address build and integration issues from paradigm system"
```
