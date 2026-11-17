import { useState } from "react";
import { cx } from "./activity-chart";

export type MemberDisplay = {
  name: string;
  imageUrl: string | null;
  kind: "member";
};

export const formerMember: MemberDisplay = {
  name: "Former member",
  imageUrl: null,
  kind: "member",
};

const tints = ["bg-orange", "bg-pink", "bg-purple", "bg-lime", "bg-info"];

export const avatarTint = (name: string) =>
  tints[
    Array.from(name).reduce(
      (hash, c) => (hash * 31 + (c.codePointAt(0) ?? 0)) % 997,
      7,
    ) % tints.length
  ];

export function MemberAvatar({
  display,
  className,
}: {
  display: Pick<MemberDisplay, "name" | "imageUrl">;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const base = cx(
    "relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded text-[0.5rem] font-medium",
    className,
  );
  if (display.imageUrl !== null && display.imageUrl !== "" && !failed)
    return (
      <span className={cx(base, "bg-secondary")}>
        <img
          src={display.imageUrl}
          alt={display.name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  return (
    <span
      role="img"
      aria-label={display.name}
      className={cx(base, "text-primary-foreground", avatarTint(display.name))}
    >
      {display.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
