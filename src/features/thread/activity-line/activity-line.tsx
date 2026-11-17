import type { ComponentProps } from "react";

export type ActivityLineProps = ComponentProps<"div">;

export function ActivityLine(props: ActivityLineProps) {
  return <div data-slot="activity-line" {...props} />;
}

export type ActivityLineMemberProps = ComponentProps<"div">;

export function ActivityLineMember(props: ActivityLineMemberProps) {
  return <div data-slot="activity-line-member" {...props} />;
}

export type LiveStatusProps = ComponentProps<"span">;

export function LiveStatus(props: LiveStatusProps) {
  return <span data-slot="live-status" {...props} />;
}
