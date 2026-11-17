import type { ComponentProps } from "react";

export type TabStripProps = ComponentProps<"div">;

export function TabStrip(props: TabStripProps) {
  return <div {...props} />;
}
