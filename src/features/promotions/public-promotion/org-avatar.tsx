import { useState } from "react";

export type OrgAvatarProps = { src: string | null; name: string };

export function OrgAvatar({ src, name }: OrgAvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src !== null && src !== "" && !failed)
    return (
      <span className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-[0.5rem]">
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
      className="flex size-4 shrink-0 items-center justify-center rounded bg-muted text-[0.5rem] font-medium text-foreground"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
