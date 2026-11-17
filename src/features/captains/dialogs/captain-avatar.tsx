import { cva, type VariantProps } from "class-variance-authority";
import type { CaptainAvatarValue } from "./avatar";
import { captainPresetSrc } from "./avatar";

export const captainAvatarVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden leading-none",
  {
    variants: {
      size: {
        "2xs": "size-2.5 rounded-(--radius-inner) text-[0.5625rem]",
        xs: "size-4 rounded-(--radius-inner) text-2xs",
        sm: "size-6 rounded-(--radius-inner) text-xs",
        base: "size-8 rounded-(--radius-sm) text-sm",
        xl: "size-12 rounded-(--radius-sm) text-2xl",
        "2xl": "size-20 rounded-(--radius-sm) text-4xl",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

export const captainAvatarTileClass =
  "flex shrink-0 items-center justify-center overflow-hidden leading-none";

export type CaptainAvatarProps = VariantProps<typeof captainAvatarVariants> & {
  avatar: CaptainAvatarValue;
  name: string;
  className?: string;
};

/** A Captain's avatar: a capybara preset, an emoji or an image on its background. */
export function CaptainAvatar({
  avatar,
  name,
  size,
  className,
}: CaptainAvatarProps) {
  const src =
    avatar.image ??
    (avatar.kind === "preset" ? captainPresetSrc(avatar.value) : undefined);
  return (
    <span
      role="img"
      aria-label={name}
      className={captainAvatarVariants({ size, className })}
      style={{ background: avatar.background }}
    >
      {src === undefined ? (
        avatar.value
      ) : (
        <img
          src={src}
          alt=""
          draggable={false}
          className="size-full object-cover select-none"
        />
      )}
    </span>
  );
}
