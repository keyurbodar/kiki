import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "@/primitives/icon";
import {
  formatListingCount,
  listingAdds,
  listingByline,
  listingParams,
  listingStarsTitle,
  trimDescription,
} from "./format";

export type ListingKind = "plugin" | "skill" | "theme";

export type ListingCard = {
  readonly kind: ListingKind;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly maker: { readonly name: string } | null;
  readonly builtIn: { readonly settingsPath: string } | null;
  readonly repository: string | null;
  readonly stars: number | null;
  readonly starsCheckedAt: Date | number | null;
  readonly adds: number | null;
  readonly theme: {
    readonly light: Readonly<Record<string, string>>;
    readonly dark: Readonly<Record<string, string>>;
    readonly wallpaper?: { readonly name: string };
  } | null;
};

const iconSizeClassName = {
  xs: "size-5 rounded-(--radius-sm) [&_svg]:size-(--icon-xs)",
  sm: "size-10 rounded-(--radius-card) [&_svg]:size-(--icon-lg)",
  lg: "size-11 rounded-(--radius-card) [&_svg]:size-(--icon-lg)",
} as const;

export type ListingIconSize = keyof typeof iconSizeClassName;

const kindIconName = {
  plugin: "plugin-1",
  skill: "book",
  theme: "color-palette",
} as const;

export type ListingIconProps = {
  card: Pick<ListingCard, "kind" | "repository" | "theme">;
  size?: ListingIconSize;
  className?: string;
};

function ThemeSwatch({ theme }: { theme: NonNullable<ListingCard["theme"]> }) {
  return (
    <span
      data-color-theme="explore-preview"
      style={theme.dark}
      className="dark grid size-full grid-cols-2 grid-rows-2"
    >
      <span className="[background:var(--bg)]" />
      <span className="[background:var(--panel)]" />
      <span className="[background:var(--fg)]" />
      <span className="[background:var(--primary)]" />
    </span>
  );
}

function RepositoryAvatar({
  repository,
  fallback,
}: {
  repository: string;
  fallback: ReactNode;
}) {
  const owner = repository.split("/")[0];
  if (owner === undefined) return fallback;
  return (
    <img
      src={`https://github.com/${encodeURIComponent(owner)}.png?size=88`}
      alt=""
      loading="lazy"
      className="size-full object-cover"
    />
  );
}

export function ListingIcon({
  card,
  size = "sm",
  className,
}: ListingIconProps) {
  const glyph = <Icon name={kindIconName[card.kind]} />;
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center overflow-hidden border-(length:--border-width-hairline) border-border-2 bg-secondary text-foreground ${iconSizeClassName[size]} ${className ?? ""}`}
    >
      {card.theme !== null ? (
        <ThemeSwatch theme={card.theme} />
      ) : card.repository !== null ? (
        <RepositoryAvatar repository={card.repository} fallback={glyph} />
      ) : (
        glyph
      )}
    </span>
  );
}

export type ListingRowProps = {
  card: ListingCard;
  metadata?: "full" | "identity";
};

const rowClassName =
  "group -mx-2 flex h-14 min-w-0 items-center gap-3 rounded px-2 outline-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset";

export function ListingRow({ card, metadata = "full" }: ListingRowProps) {
  const byline = listingByline(card);
  const content = (
    <>
      <ListingIcon card={card} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">
          {card.displayName}
        </span>
        <span className="truncate text-sm text-muted-foreground-2">
          {trimDescription(card.description)}
        </span>
      </span>
      {metadata === "full" && (
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-sm">
          {card.stars !== null && (
            <span
              title={listingStarsTitle(card.starsCheckedAt)}
              className="flex items-center gap-1 text-muted-foreground-1 tabular-nums"
            >
              <Icon name="star" size="xs" />
              {formatListingCount(card.stars)}
            </span>
          )}
          {card.adds !== null && (
            <span className="text-muted-foreground-1 tabular-nums">
              {listingAdds(card.adds)}
            </span>
          )}
          {byline !== undefined && (
            <span className="text-muted-foreground-2">{byline}</span>
          )}
        </span>
      )}
    </>
  );
  if (card.builtIn === null)
    return (
      <Link
        data-track-owner="features/explore/listing-card.tsx#ListingRow:Link.1"
        to="/explore/$kind/$slug"
        params={listingParams(card)}
        className={rowClassName}
      >
        {content}
      </Link>
    );
  return (
    <Link
      data-track-owner="features/explore/listing-card.tsx#ListingRow:Link.2"
      to={card.builtIn.settingsPath as LinkProps["to"]}
      className={rowClassName}
    >
      {content}
    </Link>
  );
}
