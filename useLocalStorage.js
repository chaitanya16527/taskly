import { useEffect, useState } from "react";

// Works like useState, but also saves the value in this browser's localStorage.
// This is TEMPORARY, browser-only persistence: it is not private, secure or shared
// between devices. It will be replaced by API/database calls for a signed-in user.
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // ignore unreadable data and fall back to the initial value
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage may be full or blocked; the app still works in memory
    }
  }, [key, value]);

  return [value, setValue];
}
