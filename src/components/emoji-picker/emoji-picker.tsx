import type { ComponentProps } from "react";

export type EmojiPickerProps = ComponentProps<"div">;

export function EmojiPicker(props: EmojiPickerProps) {
  return <div {...props} />;
}
