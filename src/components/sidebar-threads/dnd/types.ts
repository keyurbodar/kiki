import type { DragEvent } from "react";

export type SidebarDropTarget = { sectionId: string; index: number };

/**
 * The drag source and the drop zones share one controller, because a drop needs
 * the section the row started in: dropping inside its own folder reorders, and
 * dropping outside every folder unfiles.
 */
export type SidebarDragController = {
  /** The thread being dragged, or null when nothing is. */
  threadId: string | null;
  /** Where it would land right now, or null over nothing. */
  target: SidebarDropTarget | null;
  start: (
    threadId: string,
    sectionId: string,
    event: DragEvent<HTMLElement>,
  ) => void;
  over: (sectionId: string, index: number) => void;
  leave: (sectionId: string) => void;
  drop: (sectionId: string, index: number) => void;
  end: () => void;
};
