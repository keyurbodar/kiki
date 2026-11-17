import type { ComponentProps } from "react";

export type SelectorMenuListProps = ComponentProps<"div">;

export function SelectorMenuList(props: SelectorMenuListProps) {
  return <div data-slot="selector-menu-list" {...props} />;
}
