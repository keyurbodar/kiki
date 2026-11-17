import type { Modifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

export function reorderIds(
  ids: readonly string[],
  activeId: string,
  overId: string | null,
): string[] | null {
  if (overId === null || activeId === overId) return null;
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1) return null;
  return arrayMove([...ids], from, to);
}

export const restrictToVerticalContainer: Modifier = ({
  transform,
  draggingNodeRect,
  containerNodeRect,
}) => {
  if (draggingNodeRect === null || containerNodeRect === null)
    return { ...transform, x: 0 };
  const min = containerNodeRect.top - draggingNodeRect.top;
  const max = containerNodeRect.bottom - draggingNodeRect.bottom;
  return { ...transform, x: 0, y: Math.min(Math.max(transform.y, min), max) };
};
