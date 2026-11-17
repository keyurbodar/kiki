import type { ComponentProps } from "react";

export type SummaryCardProps = ComponentProps<"div">;

export function SummaryCard(props: SummaryCardProps) {
  return <div {...props} />;
}
