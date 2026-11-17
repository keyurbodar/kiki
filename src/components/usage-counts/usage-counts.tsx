import type { ComponentProps } from "react";

export type UsageCountsProps = ComponentProps<"div">;

export function UsageCounts(props: UsageCountsProps) {
  return <div {...props} />;
}
