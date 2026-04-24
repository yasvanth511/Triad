"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValueState] = useState<T>(initialValue);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setValueState(JSON.parse(item) as T);
    } catch {
      // ignore
    }
    setHasHydrated(true);
  }, [key]);

  const setValue = useCallback(
    (newValue: T) => {
      setValueState(newValue);
      try {
        if (newValue === null || newValue === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        }
      } catch {
        // ignore
      }
    },
    [key],
  );

  return { value, setValue, hasHydrated };
}
