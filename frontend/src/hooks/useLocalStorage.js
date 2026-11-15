import { useEffect, useState } from "react";

// Like useState, but the value is also saved in localStorage.
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue; // blocked storage or corrupted data
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked: the app still works, it just won't remember
    }
  }, [key, value]);

  return [value, setValue];
}
