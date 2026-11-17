import type { ComponentProps } from "react";

export type ActivityPillProps = ComponentProps<"div">;

export function ActivityPill(props: ActivityPillProps) {
  return <div {...props} />;
}
