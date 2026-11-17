import type { ComponentProps } from "react";

export type AppTopBarProps = ComponentProps<"header">;

export function AppTopBar(props: AppTopBarProps) {
  return <header {...props} />;
}
