import type { ComponentProps } from "react";

export type ThreadPreviewProps = ComponentProps<"div">;

export function ThreadPreview(props: ThreadPreviewProps) {
  return <div {...props} />;
}
