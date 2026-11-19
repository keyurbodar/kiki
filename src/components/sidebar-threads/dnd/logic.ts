/** Capy's thread drag payload; the drop targets accept on this type, not on a rendered element. */
export const THREAD_DRAG_TYPE = "application/x-capy-thread";

export const FOLDER_SECTION_PREFIX = "folder:";

export const folderIdOf = (sectionId: string): string | null =>
  sectionId.startsWith(FOLDER_SECTION_PREFIX)
    ? sectionId.slice(FOLDER_SECTION_PREFIX.length)
    : null;

/**
 * What a drop does, from the section the row came from and the one under the
 * pointer. Non-folder sections are not ordered by any endpoint we serve, so a
 * drop there only unfiles the thread; a drop inside its own folder reorders.
 */
export type DropPlan =
  | { kind: "none" }
  | { kind: "unfile" }
  | { kind: "move"; folderId: string }
  | { kind: "reorder"; folderId: string };

export const planDrop = (
  fromSectionId: string,
  toSectionId: string,
): DropPlan => {
  const toFolder = folderIdOf(toSectionId);
  const fromFolder = folderIdOf(fromSectionId);
  if (toFolder === null) {
    return fromFolder === null ? { kind: "none" } : { kind: "unfile" };
  }
  if (toFolder === fromFolder) return { kind: "reorder", folderId: toFolder };
  return { kind: "move", folderId: toFolder };
};

/** The index a pointer height lands on: above a row's middle inserts before it. */
export const insertionIndex = (
  pointerY: number,
  rowMids: ReadonlyArray<number>,
): number => {
  for (let index = 0; index < rowMids.length; index += 1) {
    const mid = rowMids[index];
    if (mid !== undefined && pointerY < mid) return index;
  }
  return rowMids.length;
};

/** Moves one id to a position, for the reorder payload before it is sent. */
export const withMoved = (
  ids: ReadonlyArray<string>,
  id: string,
  index: number,
): ReadonlyArray<string> => {
  const rest = ids.filter((candidate) => candidate !== id);
  const at = Math.max(0, Math.min(index, rest.length));
  return [...rest.slice(0, at), id, ...rest.slice(at)];
};
