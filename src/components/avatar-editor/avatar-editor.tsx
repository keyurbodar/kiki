import type { ComponentProps } from "react";

export type AvatarEditorProps = ComponentProps<"div">;

export function AvatarEditor(props: AvatarEditorProps) {
  return <div {...props} />;
}
