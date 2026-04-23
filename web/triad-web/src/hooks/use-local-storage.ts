"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const rawValue = window.localStorage.getItem(key);
      return rawValue ? (JSON.parse(rawValue) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [initialValue, key]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleStorage = (event: Event) => {
      if (event instanceof StorageEvent && event.key && event.key !== key) {
        return;
      }

      onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("triad-local-storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("triad-local-storage", handleStorage);
    };
  }, [key]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => initialValue);
  const hasHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const updateValue = (nextValue: T) => {
    if (typeof window === "undefined") {
      return;
    }

    if (nextValue == null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(nextValue));
    window.dispatchEvent(new Event("triad-local-storage"));
  };

  return { value, setValue: updateValue, hasHydrated };
}
