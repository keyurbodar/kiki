import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { ICON_IDS, Icon, type IconId } from "@/primitives/icon";

const iconIds: ReadonlySet<string> = new Set(ICON_IDS);

const isIconId = (name: string): name is IconId => iconIds.has(name);

export type MobileIconProps = Omit<ComponentProps<"svg">, "children"> & {
  name: string;
};

/**
 * Sprite icon by Capy's icon name. Ids the sprite doesn't ship yet render an
 * empty slot of the same size, tagged with the missing id.
 */
export function MobileIcon({ name, className, ...props }: MobileIconProps) {
  if (isIconId(name))
    return <Icon name={name} size="sm" className={className} {...props} />;
  return (
    <svg
      aria-hidden
      data-slot="icon"
      data-icon={name}
      data-icon-missing=""
      viewBox="0 0 24 24"
      fill="none"
      className={cx("size-(--icon-sm) shrink-0", className)}
      {...props}
    />
  );
}
