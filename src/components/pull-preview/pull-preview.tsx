import type { ComponentProps } from "react";

export type PullPreviewProps = ComponentProps<"div">;

export function PullPreview(props: PullPreviewProps) {
  return <div {...props} />;
}
