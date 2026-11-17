import { cx } from "class-variance-authority";
import { useState } from "react";

const avatarSizes = {
  "2xs": "size-2.5 rounded-(--radius-inner) text-[0.4375rem]",
  xs: "size-4 text-[0.5rem]",
  sm: "size-6 text-[0.625rem]",
  base: "size-8 text-xs",
  lg: "size-16 rounded-md text-lg",
} as const;

export type AvatarSize = keyof typeof avatarSizes;

/** Capy's two-letter initials: first letters of the first and last words. */
export const avatarInitials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

export type AvatarProps = {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
};

/** Capy's ui/avatar: the image while it loads, initials on a muted tile otherwise. */
export function Avatar({ src, name, size = "sm", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src != null && src !== "" && !failed)
    return (
      <span
        className={cx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary",
          avatarSizes[size],
          className,
        )}
      >
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "flex shrink-0 items-center justify-center rounded bg-muted font-medium text-foreground",
        avatarSizes[size],
        className,
      )}
    >
      {avatarInitials(name)}
    </span>
  );
}
