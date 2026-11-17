import { cva, type VariantProps } from "class-variance-authority";
import type { SVGProps } from "react";
import type { IconId } from "./icon-ids";
import spriteUrl from "./sprite.svg?url";

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-(--icon-xs)",
      sm: "size-(--icon-sm)",
      base: "size-(--icon-base)",
      lg: "size-(--icon-lg)",
    },
  },
  defaultVariants: { size: "base" },
});

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> &
  VariantProps<typeof iconVariants> & {
    name: IconId;
    label?: string;
  };

export function Icon({ name, label, size, className, ...props }: IconProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: the title renders when a label is given; unlabelled icons are aria-hidden
    <svg
      data-slot="icon"
      data-icon={name}
      aria-hidden={label === undefined}
      role={label === undefined ? undefined : "img"}
      fill="none"
      className={iconVariants({ size, className })}
      {...props}
    >
      {label !== undefined && <title>{label}</title>}
      <use href={`${spriteUrl}#${name}`} />
    </svg>
  );
}
