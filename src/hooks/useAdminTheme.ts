import { useEffect } from "react";

/** Marks <html> so portaled UI (dialogs, popovers) uses the light admin look. */
export const useAdminTheme = () => {
  useEffect(() => {
    document.documentElement.dataset.adminTheme = "light";
    return () => { delete document.documentElement.dataset.adminTheme; };
  }, []);
};
