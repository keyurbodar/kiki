import type { ComponentProps } from "react";

export type ActivityRowProps = ComponentProps<"div">;

export function ActivityRow(props: ActivityRowProps) {
  return <div {...props} />;
}
