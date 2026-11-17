import { useState } from "react";
import type { ExploreCard, ListingKind } from "@/data/api/schemas/explore";
import type { IconId } from "@/primitives/icon";
import { Icon } from "@/primitives/icon";
import { CheckmarkGlyph } from "./glyphs";

const kindIcons: Record<ListingKind, IconId> = {
  plugin: "plugin-1",
  skill: "books",
  theme: "color-palette",
};

const tileSizes = {
  xs: "size-5 rounded-(--radius-sm) [&_svg]:size-(--icon-xs)",
  sm: "size-10 rounded-(--radius-card) [&_svg]:size-(--icon-lg)",
  lg: "size-11 rounded-(--radius-card) [&_svg]:size-(--icon-lg)",
} as const;

const badgePlacement = {
  sm: { place: "-right-1.25 -bottom-1.25", size: "size-3.5" },
  lg: { place: "-right-1.5 -bottom-1.5", size: "size-4" },
} as const;

export type ListingIconSize = keyof typeof tileSizes;

export const repositoryOwner = (repository: string | null) =>
  repository === null ? undefined : repository.split("/")[0];

function VerifiedBadge({ size }: { size: "sm" | "lg" }) {
  const placement = badgePlacement[size];
  return (
    <span
      role="img"
      aria-label="Verified by Capy"
      title="Verified by Capy"
      className={`absolute flex rounded-full bg-panel ${placement.place}`}
    >
      <span className="relative flex rounded-full p-[calc(var(--spacing-hairline)*3)] transition-colors duration-100 group-hover:bg-secondary">
        <Icon
          name="form-seal"
          className={`text-foreground ${placement.size}`}
        />
        <CheckmarkGlyph className="absolute inset-0 m-auto size-1/2 text-panel [&_path]:stroke-[3.5]" />
      </span>
    </span>
  );
}

function OwnerAvatar({ owner, kind }: { owner: string; kind: ListingKind }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Icon name={kindIcons[kind]} />;
  return (
    <img
      src={`https://github.com/${encodeURIComponent(owner)}.png?size=88`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-full object-cover"
    />
  );
}

export type ListingIconProps = {
  card: ExploreCard;
  size?: ListingIconSize;
  className?: string;
};

export function ListingIcon({
  card,
  size = "sm",
  className,
}: ListingIconProps) {
  const owner = repositoryOwner(card.repository);
  const tile = (
    <span
      aria-hidden
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden border-hairline border-border-2 bg-secondary text-foreground",
        tileSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {card.builtIn !== null ? (
        <Icon name="plugin-1" />
      ) : owner === undefined ? (
        <Icon name={kindIcons[card.kind]} />
      ) : (
        <OwnerAvatar owner={owner} kind={card.kind} />
      )}
    </span>
  );
  if (card.source === "user" || size === "xs") return tile;
  return (
    <span className="relative flex w-fit shrink-0">
      {tile}
      <VerifiedBadge size={size} />
    </span>
  );
}
