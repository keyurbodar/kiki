import type { ComponentProps } from "react";

export type SortableListProps = ComponentProps<"div">;

export function SortableList(props: SortableListProps) {
  return <div data-slot="sortable-list" {...props} />;
}
