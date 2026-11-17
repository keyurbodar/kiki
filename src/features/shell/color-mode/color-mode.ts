import { useEffect } from "react";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

export const APPEARANCE_KEY = "capy-web:appearance";

export const readStoredColorMode = (): ColorMode => {
  try {
    const raw = globalThis.localStorage.getItem(APPEARANCE_KEY);
    const mode = raw === null ? undefined : JSON.parse(raw)?.preferences?.mode;
    return mode === "light" || mode === "dark" ? mode : "system";
  } catch {
    return "system";
  }
};

export function syncColorMode(root: HTMLElement = document.documentElement) {
  applyColorMode(readStoredColorMode(), root);
  root.style.colorScheme = root.classList.contains("dark") ? "dark" : "light";
}

export function useSystemColorMode() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncColorMode();
    query.addEventListener("change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      query.removeEventListener("change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
}
