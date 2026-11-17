import type { ComponentProps } from "react";

export type RunOnSelectProps = ComponentProps<"div">;

export function RunOnSelect(props: RunOnSelectProps) {
  return <div {...props} />;
}
