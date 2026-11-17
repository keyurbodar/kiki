import { useSyncExternalStore } from "react";

export const touchQuery = "(hover: none) and (pointer: coarse)";

export const narrowQuery = () =>
  `(width < ${getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-md").trim()})`;

export function mediaQueryStore(query: () => string) {
  let list: MediaQueryList | null = null;
  const media = () => {
    list ??= window.matchMedia(query());
    return list;
  };
  return {
    subscribe(onChange: () => void) {
      const current = media();
      current.addEventListener("change", onChange);
      return () => current.removeEventListener("change", onChange);
    },
    getSnapshot: () => media().matches,
    getServerSnapshot: () => false,
  };
}

const narrow = mediaQueryStore(narrowQuery);
const touch = mediaQueryStore(() => touchQuery);

export function useIsNarrow() {
  return useSyncExternalStore(
    narrow.subscribe,
    narrow.getSnapshot,
    narrow.getServerSnapshot,
  );
}

export function useIsTouch() {
  return useSyncExternalStore(
    touch.subscribe,
    touch.getSnapshot,
    touch.getServerSnapshot,
  );
}
