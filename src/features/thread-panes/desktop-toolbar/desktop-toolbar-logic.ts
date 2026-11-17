export const modifierKeys = [
  "ControlLeft",
  "AltLeft",
  "MetaLeft",
  "ShiftLeft",
] as const;
export const specialKeys = [
  "Escape",
  "Tab",
  "ArrowLeft",
  "ArrowUp",
  "ArrowDown",
  "ArrowRight",
] as const;

export type DesktopKey =
  | (typeof modifierKeys)[number]
  | (typeof specialKeys)[number];

const inputKeyMap: Record<string, string> = {
  deleteContentBackward: "Backspace",
  deleteWordBackward: "Backspace",
  insertLineBreak: "Enter",
  insertParagraph: "Enter",
};

export function inputTypeToKey(inputType: string): string | undefined {
  return inputKeyMap[inputType];
}

export function nextLatchedKeys(
  latched: readonly DesktopKey[],
  key: DesktopKey,
  pressed: boolean,
): readonly DesktopKey[] {
  return pressed
    ? [...new Set([...latched, key])]
    : latched.filter((candidate) => candidate !== key);
}
