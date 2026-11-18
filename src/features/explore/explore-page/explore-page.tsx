import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime, Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { ReactNode } from "react";
import type { ExploreCard } from "@/data/api/schemas/explore";
import { orgListingsAtom } from "@/data/atoms/explore";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { ScrollArea } from "@/primitives/scroll-area";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { ExploreFrame } from "../explore-frame";
import { type ListingCard, ListingIcon, ListingRow } from "../listing-card";
import { useOrgId } from "../listing-detail/explore-session";
import { PluginCategoryControl, PluginShelves } from "../plugin-shelves";
import { ThemeBrowse } from "../theme-browse";
import type { ThemeCardPreview, ThemeListingCard } from "../theme-detail";
import peerArt from "./assets/peer.svg";
import {
  type ExploreKind,
  type ExploreSearch,
  exploreDescriptions,
  exploreKinds,
  exploreLabelFor,
  exploreLabels,
  exploreSearchFor,
} from "./search";

const pageClassName = "mx-auto flex w-full max-w-200 flex-col px-6 md:px-0";
const gridClassName = "grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2";
const SKELETON_ROW_KEYS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
] as const;

export type ExploreEmptyStateProps = {
  art: string;
  line: string;
  sub?: string;
  action?: ReactNode;
};

export function ExploreEmptyState({
  art,
  line,
  sub,
  action,
}: ExploreEmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <img
        src={art}
        alt=""
        className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
      />
      <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
        {line}
      </span>
      {sub !== undefined && (
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {sub}
        </span>
      )}
      {action !== undefined && <span className="mt-2">{action}</span>}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex h-14 items-center gap-3">
      <div className="size-10 rounded-(--radius-card) bg-secondary" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-3.5 w-28 rounded bg-secondary" />
        <div className="h-3 w-48 rounded bg-secondary" />
      </div>
    </div>
  );
}

export function ExplorePageSkeleton() {
  return (
    <SkeletonPanel
      role="status"
      aria-label="Loading Explore"
      className="flex flex-col gap-9"
    >
      <div className="flex flex-col gap-2">
        <div className="h-4 w-20 rounded bg-secondary" />
        <div className={gridClassName}>
          {SKELETON_ROW_KEYS.map((key) => (
            <RowSkeleton key={key} />
          ))}
        </div>
      </div>
    </SkeletonPanel>
  );
}

export type ExploreSearchFieldProps = {
  search: ExploreSearch;
  onSearch: (search: ExploreSearch) => void;
  kind: ExploreKind;
};

export function ExploreSearchField({
  search,
  onSearch,
  kind,
}: ExploreSearchFieldProps) {
  const placeholder = kind === "plugin" ? "Search plugins" : "Search Explore";
  return (
    <Input
      type="search"
      icon={<Icon name="magnifying-glass" />}
      wrapperClassName="md:w-55 md:shrink-0"
      value={search.q ?? ""}
      onChange={(event) =>
        onSearch({
          ...search,
          q: event.target.value === "" ? undefined : event.target.value,
        })
      }
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        onSearch({ ...search, q: undefined });
        event.currentTarget.blur();
      }}
      placeholder={placeholder}
      aria-label="Search Explore"
    />
  );
}

export type ExplorePageProps = {
  kind: ExploreKind;
  search: ExploreSearch;
  onSearch: (search: ExploreSearch) => void;
};

function matchesSearch(
  card: { displayName: string; description: string },
  q: string | undefined,
) {
  if (q === undefined) return true;
  const needle = q.toLowerCase();
  return (
    card.displayName.toLowerCase().includes(needle) ||
    card.description.toLowerCase().includes(needle)
  );
}

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (DateTime.isDateTime(value)) return DateTime.toDate(value);
  if (typeof value === "string" || typeof value === "number")
    return new Date(value);
  return null;
};

const isPalette = (value: unknown): value is Readonly<Record<string, string>> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

const readTheme = (value: unknown): ThemeCardPreview | null => {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (!isPalette(record.light) || !isPalette(record.dark)) return null;
  const wallpaper = record.wallpaper;
  return {
    light: record.light,
    dark: record.dark,
    ...(typeof wallpaper === "object" &&
    wallpaper !== null &&
    typeof (wallpaper as { name?: unknown }).name === "string"
      ? { wallpaper: { name: (wallpaper as { name: string }).name } }
      : {}),
  };
};

const toListingCard = (card: ExploreCard | ThemeListingCard): ListingCard => ({
  kind: card.kind,
  source: card.source === "user" ? "user" : "catalog",
  slug: card.slug,
  displayName: card.displayName,
  description: card.description,
  maker: card.maker === null ? null : { name: card.maker.name },
  builtIn:
    card.builtIn !== null &&
    typeof card.builtIn === "object" &&
    "settingsPath" in card.builtIn
      ? { settingsPath: String(card.builtIn.settingsPath) }
      : null,
  repository: "repository" in card ? card.repository : null,
  stars: "stars" in card ? card.stars : null,
  starsCheckedAt: "starsCheckedAt" in card ? toDate(card.starsCheckedAt) : null,
  adds: card.adds,
  theme: readTheme(card.theme),
});

const toThemeListingCard = (card: ExploreCard): ThemeListingCard => ({
  kind: card.kind,
  slug: card.slug,
  versionId: card.versionId,
  displayName: card.displayName,
  description: card.description,
  source: card.source === "user" ? "user" : "capy",
  builtIn: card.builtIn,
  maker: card.maker === null ? null : { name: card.maker.name },
  adds: card.adds,
  version: card.version,
  updatedAt: toDate(card.updatedAt) ?? new Date(0),
  featuredRank: card.featuredRank,
  theme: readTheme(card.theme),
});

export function ExplorePage({ kind, search, onSearch }: ExplorePageProps) {
  const orgId = useOrgId();
  const result = useAtomValue(orgListingsAtom(orgId ?? ""));
  const index = Option.getOrUndefined(AsyncResult.value(result));
  const failed = AsyncResult.isFailure(result);
  const label = exploreLabels[kind];
  const cards =
    index === undefined
      ? undefined
      : index.cards.filter(
          (card) => card.kind === kind && matchesSearch(card, search.q),
        );

  const body =
    failed === true ? (
      <ExploreEmptyState
        art={peerArt}
        line="Explore didn't load"
        sub="Try again in a moment"
      />
    ) : cards === undefined ? (
      <ExplorePageSkeleton />
    ) : kind === "plugin" ? (
      <PluginShelves
        cards={cards}
        search={search}
        onSearch={onSearch}
        renderCard={(card) => (
          <ListingRow key={card.slug} card={toListingCard(card)} />
        )}
      />
    ) : cards.length === 0 ? (
      search.q === undefined ? (
        <ExploreEmptyState
          art={peerArt}
          line={`No ${exploreLabelFor(kind)} listed yet`}
        />
      ) : (
        <ExploreEmptyState
          art={peerArt}
          line={`No ${exploreLabelFor(kind)} match that search`}
          sub="Try another word or clear the search"
          action={
            <Button
              data-track-owner="features/explore/explore-page.tsx#ExplorePage:Button[Clear search]"
              variant="outline"
              onClick={() => onSearch({})}
            >
              Clear search
            </Button>
          }
        />
      )
    ) : kind === "theme" ? (
      <ThemeBrowse
        cards={cards.map(toThemeListingCard)}
        search={{ q: search.q, page: search.page }}
        onSearch={(next) => onSearch({ ...search, ...next })}
        icon={(card) => <ListingIcon card={toListingCard(card)} size="xs" />}
      />
    ) : (
      <div className={gridClassName}>
        {cards.map((card) => (
          <ListingRow key={card.slug} card={toListingCard(card)} />
        ))}
      </div>
    );

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <ExploreFrame
        crumbs={[{ label: "Explore", to: "/explore" }, { label }]}
      />
      <header className={`${pageClassName} shrink-0 gap-5 pt-12 pb-6`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h1 className="text-xl font-medium text-foreground">{label}</h1>
            <div className="grid text-sm text-muted-foreground-1">
              {exploreKinds.map((each) => (
                <p
                  key={each}
                  className={`col-start-1 row-start-1 ${each === kind ? "" : "invisible"}`}
                  aria-hidden={each !== kind}
                >
                  {exploreDescriptions[each]}
                </p>
              ))}
            </div>
          </div>
          <ExploreSearchField search={search} onSearch={onSearch} kind={kind} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <nav
            aria-label="Explore types"
            className="-ml-2 flex items-center gap-1"
          >
            {exploreKinds.map((each) => (
              <Button
                key={each}
                data-track-owner="features/explore/explore-page.tsx#ExplorePage:Button.1"
                variant="ghost"
                size="sm"
                data-selected={each === kind ? "" : undefined}
                aria-current={each === kind ? "true" : undefined}
                render={
                  <Link
                    data-track-owner="features/explore/explore-page.tsx#ExplorePage:Link.1"
                    to="/explore"
                    search={exploreSearchFor(search, each)}
                    resetScroll={false}
                  />
                }
              >
                {exploreLabels[each]}
              </Button>
            ))}
          </nav>
          {kind === "plugin" && (
            <PluginCategoryControl search={search} onSearch={onSearch} />
          )}
        </div>
      </header>
      <ScrollArea className="flex-1" scrollRestorationId="explore-list">
        <div className={`${pageClassName} min-h-full gap-9 pt-3 pb-18`}>
          {body}
        </div>
      </ScrollArea>
    </div>
  );
}
