import { type DragEvent, useCallback, useRef, useState } from "react";
import {
  folderIdOf,
  planDrop,
  type SidebarDragController,
  type SidebarDropTarget,
} from "@/components/sidebar-threads/dnd";
import { type DragGhost, startDragGhost } from "./drag-ghost";

/** How long a dragged thread rests on a closed folder before it opens. */
const DETENT_MS = 500;

export type SidebarThreadDragActions = {
  move: (threadId: string, folderId: string, index: number) => void;
  unfile: (threadId: string) => void;
  reorder: (threadId: string, folderId: string, index: number) => void;
  /** Whether a section is collapsed, so hovering it can open it. */
  isSectionOpen: (sectionId: string) => boolean;
  openSection: (sectionId: string) => void;
};

export function useSidebarThreadDrag(
  actions: SidebarThreadDragActions,
): SidebarDragController {
  const { move, unfile, reorder, isSectionOpen, openSection } = actions;
  const [active, setActive] = useState<{
    threadId: string;
    sectionId: string;
  } | null>(null);
  // The drag events between start and drop arrive in their own ticks, so the
  // handlers read the drag through a ref instead of the last render's closure.
  const activeRef = useRef<{
    threadId: string;
    sectionId: string;
  } | null>(null);
  const [target, setTarget] = useState<SidebarDropTarget | null>(null);
  const ghost = useRef<DragGhost | null>(null);
  const detent = useRef<{ sectionId: string; timer: number } | null>(null);

  const clearDetent = useCallback(() => {
    if (detent.current !== null) {
      window.clearTimeout(detent.current.timer);
      detent.current = null;
    }
  }, []);

  const stopGhost = useCallback(() => {
    ghost.current?.stop();
    ghost.current = null;
  }, []);

  const end = useCallback(() => {
    clearDetent();
    stopGhost();
    activeRef.current = null;
    setActive(null);
    setTarget(null);
  }, [clearDetent, stopGhost]);

  const start = useCallback(
    (threadId: string, sectionId: string, event: DragEvent<HTMLElement>) => {
      const row = event.currentTarget.closest<HTMLElement>("[data-drag-row]");
      if (row === null) return;
      stopGhost();
      ghost.current = startDragGhost(row, event.nativeEvent);
      activeRef.current = { threadId, sectionId };
      setActive({ threadId, sectionId });
    },
    [stopGhost],
  );

  const over = useCallback(
    (sectionId: string, index: number) => {
      if (activeRef.current === null) return;
      setTarget((current) =>
        current?.sectionId === sectionId && current.index === index
          ? current
          : { sectionId, index },
      );
      if (folderIdOf(sectionId) === null || isSectionOpen(sectionId)) {
        clearDetent();
        return;
      }
      if (detent.current?.sectionId === sectionId) return;
      clearDetent();
      const timer = window.setTimeout(() => {
        detent.current = null;
        openSection(sectionId);
      }, DETENT_MS);
      detent.current = { sectionId, timer };
    },
    [clearDetent, isSectionOpen, openSection],
  );

  const leave = useCallback(
    (sectionId: string) => {
      if (detent.current?.sectionId === sectionId) clearDetent();
      setTarget((current) =>
        current?.sectionId === sectionId ? null : current,
      );
    },
    [clearDetent],
  );

  const drop = useCallback(
    (sectionId: string, index: number) => {
      const dragged = activeRef.current;
      clearDetent();
      stopGhost();
      activeRef.current = null;
      setActive(null);
      setTarget(null);
      if (dragged === null) return;
      const plan = planDrop(dragged.sectionId, sectionId);
      if (plan.kind === "none") return;
      if (plan.kind === "unfile") {
        unfile(dragged.threadId);
        return;
      }
      if (plan.kind === "reorder") {
        reorder(dragged.threadId, plan.folderId, index);
        return;
      }
      move(dragged.threadId, plan.folderId, index);
    },
    [clearDetent, stopGhost, move, reorder, unfile],
  );

  return {
    threadId: active?.threadId ?? null,
    target,
    start,
    over,
    leave,
    drop,
    end,
  };
}
