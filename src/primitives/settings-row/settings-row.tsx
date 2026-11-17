import type { ComponentProps } from "react";

export type SettingsRowProps = ComponentProps<"div">;

export function SettingsRow(props: SettingsRowProps) {
  return <div data-slot="settings-row" {...props} />;
}

export type SettingsRowLinkProps = ComponentProps<"a">;

export function SettingsRowLink(props: SettingsRowLinkProps) {
  return <a data-slot="settings-row-link" {...props} />;
}
