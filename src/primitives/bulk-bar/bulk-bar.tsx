import type { ComponentProps } from "react";

export type BulkBarProps = ComponentProps<"div">;

export function BulkBar(props: BulkBarProps) {
  return <div data-slot="bulk-bar" {...props} />;
}
