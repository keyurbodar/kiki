import { useState } from "react";
import { initials } from "./state";

export type OrganizationAvatarProps = { src: string | null; name: string };

/** Capy's base-size avatar: the image, or the name's initials. */
export function OrganizationAvatar({ src, name }: OrganizationAvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src !== null && src !== "" && !failed)
    return (
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-xs">
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
      className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-foreground"
    >
      {initials(name)}
    </span>
  );
}
