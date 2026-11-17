import type { ComponentProps } from "react";

export type FileTreeProps = ComponentProps<"div">;

export function FileTree(props: FileTreeProps) {
  return <div {...props} />;
}
