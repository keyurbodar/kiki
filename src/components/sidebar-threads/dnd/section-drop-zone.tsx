import { cx } from "class-variance-authority";
import type { DragEvent, ReactNode } from "react";
import { insertionIndex, THREAD_DRAG_TYPE } from "./logic";
import type { SidebarDragController } from "./types";

const rowsOf = (element: HTMLElement) =>
  Array.from(element.querySelectorAll<HTMLElement>("[data-drag-row]"));

const indexAt = (element: HTMLElement, pointerY: number) =>
  insertionIndex(
    pointerY,
    rowsOf(element).map((row) => {
      const rect = row.getBoundingClientRect();
      return rect.top + rect.height / 2;
    }),
  );

/**
 * One section's drop zone. A drop inside a folder lands at the row it was
 * released above; a drop on any other section takes the thread out of its folder.
 */
export function SectionDropZone({
  sectionId,
  drag,
  highlighted,
  className,
  children,
}: {
  sectionId: string;
  drag: SidebarDragController;
  highlighted: boolean;
  className?: string;
  children: ReactNode;
}) {
  const accepts = (event: DragEvent<HTMLElement>) =>
    event.dataTransfer.types.includes(THREAD_DRAG_TYPE);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag targets are not focusable controls, as in Capy
    <div
      data-drop-section={sectionId}
      data-drop-highlighted={highlighted ? "" : undefined}
      className={cx(
        "flex flex-col rounded transition-colors duration-100",
        highlighted && "bg-secondary",
        className,
      )}
      onDragOver={(event) => {
        if (!accepts(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        drag.over(sectionId, indexAt(event.currentTarget, event.clientY));
      }}
      onDrop={(event) => {
        if (!accepts(event)) return;
        event.preventDefault();
        const index = indexAt(event.currentTarget, event.clientY);
        drag.drop(sectionId, index);
      }}
    >
      {children}
    </div>
  );
}

export function DropLine() {
  return (
    <div
      aria-hidden
      data-drop-line=""
      className="kiki-sidebar-drop-line -mx-1 shrink-0 rounded-full bg-primary"
    />
  );
}
