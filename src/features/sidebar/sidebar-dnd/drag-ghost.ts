/**
 * Capy draws its own drag ghost: a fixed clone of the row that follows the
 * pointer, over a transparent native drag image. The clone is stripped of ids
 * and of the hover cluster before it is shown.
 */
const GHOST_CLASS =
  "pointer-events-none fixed top-0 left-0 z-(--z-overlay-content) overflow-hidden rounded border-[0.5px] border-border-2 bg-popover shadow-overlay will-change-transform";

const transparentImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas;
};

export type DragGhost = { stop: () => void };

export const startDragGhost = (
  row: HTMLElement,
  event: DragEvent,
): DragGhost => {
  const rect = row.getBoundingClientRect();
  event.dataTransfer?.setDragImage(transparentImage(), 0, 0);

  const clone = row.cloneNode(true);
  if (!(clone instanceof HTMLElement)) return { stop: () => undefined };
  clone.removeAttribute("id");
  for (const element of clone.querySelectorAll("[id]")) {
    element.removeAttribute("id");
  }
  for (const element of clone.querySelectorAll("[data-drag-hide]")) {
    element.remove();
  }
  clone.classList.add("pointer-events-none");
  for (const element of clone.querySelectorAll(
    "a, [data-slot=sidebar-thread-row]",
  )) {
    element.classList.remove("opacity-40", "bg-secondary");
  }

  const ghost = document.createElement("div");
  ghost.className = GHOST_CLASS;
  ghost.setAttribute("aria-hidden", "true");
  ghost.inert = true;
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.append(clone);

  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  const place = (x: number, y: number) => {
    ghost.style.transform = `translate(${x - offsetX}px, ${y - offsetY}px)`;
  };
  place(event.clientX, event.clientY);
  document.body.append(ghost);

  let frame = 0;
  const follow = (move: DragEvent) => {
    if (move.clientX === 0 && move.clientY === 0) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => place(move.clientX, move.clientY));
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    ghost.remove();
    window.removeEventListener("dragover", follow, true);
    window.removeEventListener("drop", stop, true);
    window.removeEventListener("dragend", stop, true);
  };

  window.addEventListener("dragover", follow, true);
  window.addEventListener("drop", stop, true);
  window.addEventListener("dragend", stop, true);
  return { stop };
};
