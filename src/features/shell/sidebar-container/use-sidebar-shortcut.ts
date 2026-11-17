import { useEffect, useRef } from "react";

export const isSidebarToggleShortcut = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) &&
  !event.shiftKey &&
  !event.altKey &&
  event.key.toLowerCase() === "b";

const insideOverlay = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest("[role=dialog], [role=alertdialog]") !== null;

export function useSidebarShortcut(toggle: () => void) {
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (!isSidebarToggleShortcut(event) || insideOverlay(event.target))
        return;
      event.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
