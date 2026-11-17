import type { ComponentProps } from "react";

export type UserMenuProps = ComponentProps<"div">;

export function UserMenu(props: UserMenuProps) {
  return <div {...props} />;
}
