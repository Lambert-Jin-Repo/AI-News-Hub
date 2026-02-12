"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

interface ThemeTransitionContextValue {
  theme: string;
  toggleTheme: () => void;
  registerToggleRef: (el: HTMLButtonElement | null) => void;
}

const ThemeTransitionContext = React.createContext<ThemeTransitionContextValue>({
  theme: "light",
  toggleTheme: () => {},
  registerToggleRef: () => {},
});

export function useThemeTransition() {
  return React.useContext(ThemeTransitionContext);
}

const THEME_BG = {
  dark: "#102220",
  light: "#F5F5F0",
} as const;

function ThemeTransitionProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const toggleRef = React.useRef<HTMLButtonElement | null>(null);
  const animatingRef = React.useRef(false);

  const registerToggleRef = React.useCallback(
    (el: HTMLButtonElement | null) => {
      toggleRef.current = el;
    },
    [],
  );

  const toggleTheme = React.useCallback(() => {
    if (animatingRef.current) return;

    const nextTheme = theme === "dark" ? "light" : "dark";

    // Calculate click origin from the toggle button
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;

    if (toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    }

    // Max radius = hypotenuse to farthest viewport corner
    const maxRadius = Math.ceil(
      Math.sqrt(
        Math.max(cx, window.innerWidth - cx) ** 2 +
          Math.max(cy, window.innerHeight - cy) ** 2,
      ),
    );

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "theme-transition-overlay";
    overlay.style.backgroundColor = THEME_BG[nextTheme];
    overlay.style.setProperty("--cx", `${cx}px`);
    overlay.style.setProperty("--cy", `${cy}px`);
    overlay.style.setProperty("--max-radius", `${maxRadius}px`);

    document.body.appendChild(overlay);
    animatingRef.current = true;

    // Fallback cleanup in case animationend never fires
    const fallbackTimer = setTimeout(() => {
      cleanup();
    }, 1000);

    function cleanup() {
      clearTimeout(fallbackTimer);
      if (!animatingRef.current) return;
      animatingRef.current = false;
      setTheme(nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      overlay.remove();
    }

    overlay.addEventListener("animationend", cleanup, { once: true });
  }, [theme, setTheme]);

  const value = React.useMemo(
    () => ({ theme: theme ?? "light", toggleTheme, registerToggleRef }),
    [theme, toggleTheme, registerToggleRef],
  );

  return (
    <ThemeTransitionContext.Provider value={value}>
      {children}
    </ThemeTransitionContext.Provider>
  );
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeTransitionProvider>{children}</ThemeTransitionProvider>
    </NextThemesProvider>
  );
}
