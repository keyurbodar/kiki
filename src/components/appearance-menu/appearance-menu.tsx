import type { ComponentProps } from "react";

export type AppearanceMenuProps = ComponentProps<"div">;

export function AppearanceMenu(props: AppearanceMenuProps) {
  return <div {...props} />;
}
