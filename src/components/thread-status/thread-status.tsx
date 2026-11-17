import type { ComponentProps } from "react";

export type ThreadStatusProps = ComponentProps<"span">;

export function ThreadStatus(props: ThreadStatusProps) {
  return <span {...props} />;
}
