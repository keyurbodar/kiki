import { cx } from "class-variance-authority";
import { useState } from "react";

/*
 * Local stand-in for Capy's ui/avatar: `src/primitives/avatar` belongs to the
 * primitives package, so this page keeps its own copy until that lands.
 */

const avatarSizes = {
  xs: "size-4 text-2xs",
  sm: "size-6 text-2xs",
} as const;

export type MemberAvatarSize = keyof typeof avatarSizes;

/** Capy's two-letter initials: first letters of the first and last words. */
export const initials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

export type MemberAvatarProps = {
  src?: string | null;
  name: string;
  size?: MemberAvatarSize;
};

/** The image while it loads, initials on a muted tile otherwise. */
export function MemberAvatar({ src, name, size = "sm" }: MemberAvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src != null && src !== "" && !failed)
    return (
      <span
        className={cx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary",
          avatarSizes[size],
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
      )}
    >
      {initials(name)}
    </span>
  );
}
