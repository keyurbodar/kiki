import type { ComponentProps } from "react";

export type AppearanceCardProps = ComponentProps<"div">;

export function AppearanceCard(props: AppearanceCardProps) {
  return <div data-slot="appearance-card" {...props} />;
}
