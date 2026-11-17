import { useState } from "react";

export type OrgAvatarProps = {
  src: string | null;
  name: string;
};

export function OrgAvatar({ src, name }: OrgAvatarProps) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <span className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded bg-secondary text-[0.5rem] font-medium text-muted-foreground-1"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
