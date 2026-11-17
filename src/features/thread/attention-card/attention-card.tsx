import type { ComponentProps } from "react";

export type AttentionCardProps = ComponentProps<"div">;

export function AttentionCard(props: AttentionCardProps) {
  return <div data-slot="attention-card" {...props} />;
}
