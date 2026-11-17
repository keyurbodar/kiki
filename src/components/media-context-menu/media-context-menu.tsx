import type { ComponentProps } from "react";

export type MediaContextMenuProps = ComponentProps<"div">;

export function MediaContextMenu(props: MediaContextMenuProps) {
  return <div {...props} />;
}
