import { useSyncExternalStore } from "react";

const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

let narrowQuery = "";

const getNarrowQuery = () => {
  if (narrowQuery) return narrowQuery;
  const md = getComputedStyle(document.documentElement)
    .getPropertyValue("--breakpoint-md")
    .trim();
  if (!md) return "not all";
  narrowQuery = `(width < ${md})`;
  return narrowQuery;
};

export const isPhoneViewport = () =>
  window.matchMedia(getNarrowQuery()).matches &&
  window.matchMedia(TOUCH_QUERY).matches;

const subscribe = (onChange: () => void) => {
  const queries = [
    window.matchMedia(getNarrowQuery()),
    window.matchMedia(TOUCH_QUERY),
  ];
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
};

export function useIsPhone() {
  return useSyncExternalStore(subscribe, isPhoneViewport, () => false);
}
