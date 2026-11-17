export type PillCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export const pillCornerClass: Record<PillCorner, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};

export function moveCorner(
  corner: PillCorner,
  key: string,
): PillCorner | undefined {
  if (key === "ArrowLeft")
    return corner.endsWith("left")
      ? undefined
      : (`${corner.split("-")[0]}-left` as PillCorner);
  if (key === "ArrowRight")
    return corner.endsWith("right")
      ? undefined
      : (`${corner.split("-")[0]}-right` as PillCorner);
  if (key === "ArrowUp")
    return corner.startsWith("top")
      ? undefined
      : (`top-${corner.split("-")[1]}` as PillCorner);
  if (key === "ArrowDown")
    return corner.startsWith("bottom")
      ? undefined
      : (`bottom-${corner.split("-")[1]}` as PillCorner);
  return undefined;
}
