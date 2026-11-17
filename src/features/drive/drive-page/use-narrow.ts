import { useSyncExternalStore } from "react";

const query = "(width < 48rem)";

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/** True below Capy's md breakpoint, where drive tables drop their wide columns. */
export function useNarrow() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
