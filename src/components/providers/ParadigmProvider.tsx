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
      if (idx === PARADIGMS.length - 1) return null;
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
