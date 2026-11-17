import type { ComponentProps } from "react";

export type SettingsPageProps = ComponentProps<"div">;

export function SettingsPage(props: SettingsPageProps) {
  return <div {...props} />;
}
