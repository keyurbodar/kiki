import type { ComponentProps } from "react";
import { ICON_IDS, Icon, type IconId } from "@/primitives/icon";

export type SettingsIconProps = Omit<ComponentProps<"svg">, "children"> & {
  name: string;
};

const iconIds: ReadonlySet<string> = new Set(ICON_IDS);

const isIconId = (name: string): name is IconId => iconIds.has(name);

/**
 * CDS icon by Capy's icon name. Most settings icons are not in the sprite yet;
 * those render an empty slot of the same size, tagged with the missing id.
 */
export function SettingsIcon({ name, ...props }: SettingsIconProps) {
  if (isIconId(name)) return <Icon name={name} size="sm" {...props} />;
  return (
    <svg
      aria-hidden
      data-slot="icon"
      data-icon={name}
      data-icon-missing=""
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    />
  );
}
