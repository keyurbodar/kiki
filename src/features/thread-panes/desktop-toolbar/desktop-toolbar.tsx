import type { ComponentProps } from "react";

export type DesktopToolbarProps = ComponentProps<"div">;

export function DesktopToolbar(props: DesktopToolbarProps) {
  return <div data-slot="desktop-toolbar" {...props} />;
}
