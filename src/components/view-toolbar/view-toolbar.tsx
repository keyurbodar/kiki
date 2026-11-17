import type { ComponentProps } from "react";

export type ViewToolbarProps = ComponentProps<"div">;

export function ViewToolbar(props: ViewToolbarProps) {
  return <div {...props} />;
}
