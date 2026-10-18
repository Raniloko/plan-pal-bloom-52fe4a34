import { useCallback, useState } from "react";

export type AdminTheme = "dark" | "light";
const KEY = "admin-theme";

const read = (): AdminTheme => {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
};

export const useAdminTheme = () => {
  const [theme, setTheme] = useState<AdminTheme>(read);
  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);
  return { theme, toggle };
};
