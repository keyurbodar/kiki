import type { ComponentProps } from "react";

export type ChatIdentityProps = ComponentProps<"div"> & {
  /** Captain name; its first letter stands in when there is no avatar. */
  name?: string;
  /** Avatar image URL from the captain library. */
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "base";
};

const sizeClass = {
  xs: "size-4 text-2xs",
  sm: "size-6 text-xs",
  base: "size-8 text-sm",
} as const;

/** A captain's avatar: its library image, or its initial on a neutral tile. */
export function ChatIdentity({
  name = "",
  avatarUrl,
  size = "xs",
  className,
  ...props
}: ChatIdentityProps) {
  return (
    <div
      data-slot="chat-identity"
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xs bg-secondary font-medium text-muted-foreground-1",
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}
