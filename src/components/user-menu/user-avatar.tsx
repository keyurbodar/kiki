import { useState } from "react";

const avatarSizes = {
  xs: "size-4 text-avatar-xs",
  sm: "size-6 text-avatar-sm",
} as const;

export const avatarInitials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return (
    (words[0]?.[0] ?? "") + (words.length > 1 ? (words.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
};

export type UserAvatarProps = {
  src: string | null;
  name: string;
  size?: keyof typeof avatarSizes;
};

export function UserAvatar({ src, name, size = "sm" }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src !== null && src !== "" && !failed) {
    return (
      <span
        className={
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary " +
          avatarSizes[size]
        }
      >
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={
        "flex shrink-0 items-center justify-center rounded bg-muted font-medium text-foreground " +
        avatarSizes[size]
      }
    >
      {avatarInitials(name)}
    </span>
  );
}
