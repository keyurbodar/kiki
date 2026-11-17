import type { Captain } from "@/data/atoms/agent-context";
import { Icon } from "@/primitives/icon";

export type ScopeProject = {
  id: string;
  name: string;
  logoUrl: string | null;
  repos: ReadonlyArray<unknown>;
};

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

/** Capy's ProjectIcon: the project's own logo, else its repository glyph. */
export function ProjectGlyph({
  project,
  className,
}: {
  project: ScopeProject;
  className?: string;
}) {
  if (project.logoUrl !== null)
    return (
      <img
        draggable={false}
        alt=""
        src={project.logoUrl}
        className={cx(
          "inline-block size-(--icon-sm) shrink-0 rounded-(--radius-sm) object-cover select-none",
          className,
        )}
      />
    );
  return (
    <Icon
      name={project.repos.length > 1 ? "square-behind-square-2" : "box-2"}
      className={className}
    />
  );
}

const avatarSize = {
  "2xs": "size-2.5 rounded-(--radius-inner) text-2xs",
  xs: "size-4 rounded-(--radius-inner) text-2xs",
} as const;

/** Capy's captain Avatar: the captain image, else its initial on a tile. */
export function CaptainAvatar({
  captain,
  size,
}: {
  captain: Captain;
  size: keyof typeof avatarSize;
}) {
  return (
    <span
      role="img"
      aria-label={captain.name}
      className={cx(
        "flex shrink-0 items-center justify-center overflow-hidden leading-none bg-secondary text-foreground",
        avatarSize[size],
      )}
    >
      {captain.imageUrl ? (
        <img
          src={captain.imageUrl}
          alt=""
          draggable={false}
          className="size-full object-cover select-none"
        />
      ) : (
        captain.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
