import { useState } from "react";
import { cn } from "@/lib/cn";

const sizes = {
  xs: "size-4 text-[length:--spacing(2)]",
  sm: "size-6 text-[length:--spacing(2.5)]",
  stack: "size-5 text-[length:--spacing(2)] ring-2 ring-popover",
} as const;

export type PersonAvatarProps = {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
};

export const initialsOf = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${words[0]?.[0] ?? ""}${last}`.toUpperCase();
};

export function PersonAvatar({
  src,
  name,
  size = "sm",
  className,
}: PersonAvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src != null && src !== "" && !failed)
    return (
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary",
          sizes[size],
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
      className={cn(
        "flex shrink-0 items-center justify-center rounded bg-muted font-medium text-foreground",
        sizes[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
