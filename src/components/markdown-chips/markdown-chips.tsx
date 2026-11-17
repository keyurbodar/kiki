import type { ComponentProps } from "react";

export type MarkdownChipProps = ComponentProps<"span">;

export function MarkdownChip(props: MarkdownChipProps) {
  return <span {...props} />;
}
