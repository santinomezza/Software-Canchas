"use client";

import * as React from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "cancha-theme";

/**
 * Runs before paint to avoid a flash of the wrong theme.
 * Kept inline and tiny on purpose.
 *
 * The dark theme is the product's default identity, so the system preference
 * is ignored unless the visitor explicitly chose a theme before.
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var t=s==="light"||s==="dark"?s:"dark";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The theme lives in the DOM attribute, so the provider reads it from there
  // instead of duplicating it in React state.
  const theme = React.useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);

  const setTheme = React.useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — theme still applies for the session */
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return context;
}
