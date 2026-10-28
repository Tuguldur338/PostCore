"use client";

import { useSyncExternalStore } from "react";

const favoritesStorageKey = "postcore-favorites";
const emptyFavorites: string[] = [];
const listeners = new Set<() => void>();
let cachedFavorites: string[] | null = null;

function parseFavorites(raw: string | null): string[] {
  if (!raw) return emptyFavorites;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptyFavorites;
    return [...new Set(parsed.filter((value): value is string => typeof value === "string"))];
  } catch {
    return emptyFavorites;
  }
}

export function getFavorites(): string[] {
  if (typeof window === "undefined") return emptyFavorites;
  if (cachedFavorites) return cachedFavorites;
  cachedFavorites = parseFavorites(window.localStorage.getItem(favoritesStorageKey));
  return cachedFavorites;
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function writeFavorites(nextFavorites: string[]) {
  const unique = [...new Set(nextFavorites)];
  cachedFavorites = unique;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(favoritesStorageKey, JSON.stringify(unique));
    } catch {
      // Storage can be unavailable in private mode; keep the in-memory value.
    }
  }
  emitChange();
}

export function toggleFavorite(productId: string): boolean {
  const current = getFavorites();
  const isSaved = current.includes(productId);
  writeFavorites(
    isSaved ? current.filter((id) => id !== productId) : [...current, productId],
  );
  return !isSaved;
}

export function removeFavorite(productId: string) {
  const current = getFavorites();
  if (!current.includes(productId)) return;
  writeFavorites(current.filter((id) => id !== productId));
}

export function subscribeToFavorites(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== favoritesStorageKey) return;
    cachedFavorites = parseFavorites(event.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites(): string[] {
  return useSyncExternalStore(
    subscribeToFavorites,
    getFavorites,
    () => emptyFavorites,
  );
}

export function useSavedCount(): number {
  return useFavorites().length;
}
