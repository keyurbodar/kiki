import { createPortal } from "react-dom";
import { ImagesIcon } from "./icons";

/** Full-window target shown while files are dragged over the active composer. */
export function AttachmentDropOverlay({ open }: { open: boolean }) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-(--z-overlay-content) flex items-center justify-center bg-overlay p-6 transition-opacity duration-fast ease-out">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-(--radius-panel) border-[length:calc(var(--spacing)/8)] border-dashed border-border-3 bg-popover px-12 py-10 text-center shadow-overlay">
        <span className="flex size-10 items-center justify-center rounded-(--radius) bg-secondary text-icon-muted">
          <ImagesIcon className="size-(--icon-lg) shrink-0" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium text-foreground">
            Drop files to attach
          </span>
          <span className="text-sm text-muted-foreground-2">
            Up to 250 MB per file
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
