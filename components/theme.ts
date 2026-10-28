"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const themeStorageKey = "postcore-theme";
const themeChangeEvent = "postcore-theme-change";

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(themeChangeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
}

export function toggleTheme() {
  const nextTheme: Theme = getThemeSnapshot() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  try {
    window.localStorage.setItem(themeStorageKey, nextTheme);
  } catch {
    // Ignore storage failures; the theme still applies for this page.
  }
  window.dispatchEvent(new Event(themeChangeEvent));
}
