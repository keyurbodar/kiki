import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  formatCount,
  listingParams,
  makerName,
  SignInButton,
  type ThemeListingCard,
  ThemeStage,
  themeStageClassName,
  trimDescription,
  useDarkMode,
  useInView,
  useThemeWallpaper,
  WallpaperFrame,
} from "../theme-detail";
import { useExploreSession } from "../theme-visibility";
import { arrangeThemes, type ThemeBrowseSearch, themeByline } from "./arrange";

const cx = (...parts: ReadonlyArray<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

const GRID_CLASS_NAME = "kiki-theme-grid";

export type ThemeCardSlot = (card: ThemeListingCard) => ReactNode;

export type PagerProps = {
  current: number;
  pages: number;
  onPage: (page: number) => void;
};

export function Pager({ current, pages, onPage }: PagerProps) {
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="Theme pages"
      className="flex items-center justify-between gap-3"
    >
      <Button
        data-track-owner="features/explore/theme-browse.tsx#Pager:Button[Previous]"
        variant="ghost"
        size="sm"
        disabled={current === 1}
        onClick={() => onPage(current - 1)}
      >
        Previous
      </Button>
      <span className="text-xs text-muted-foreground-2 tabular-nums">
        {current} of {pages}
      </span>
      <Button
        data-track-owner="features/explore/theme-browse.tsx#Pager:Button[Next]"
        variant="ghost"
        size="sm"
        disabled={current === pages}
        onClick={() => onPage(current + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

export function ThemeCover({
  card,
  visible,
  className,
  children,
}: {
  card: ThemeListingCard;
  visible: boolean;
  className: string;
  children?: ReactNode;
}) {
  const image = useThemeWallpaper(card.slug, card.versionId);
  const dark = useDarkMode();
  return (
    <WallpaperFrame
      image={visible ? image : undefined}
      background={card.theme?.[dark ? "dark" : "light"]["--bg"]}
      className={className}
    >
      {children}
    </WallpaperFrame>
  );
}

/**
 * A theme draws its wallpaper only when the listing's image is there; a theme
 * whose image is missing draws its palette instead of an empty frame.
 */
export function useCoverWallpaper(card: ThemeListingCard, visible: boolean) {
  const image = useThemeWallpaper(card.slug, card.versionId);
  return visible && image !== undefined && card.theme?.wallpaper !== undefined;
}

export type ThemeTileProps = { card: ThemeListingCard; icon?: ThemeCardSlot };

export function ThemeTile({ card, icon }: ThemeTileProps) {
  const dark = useDarkMode();
  const [ref, visible] = useInView();
  const wallpaper = useCoverWallpaper(card, visible);
  if (card.theme === null) return null;
  return (
    <Link
      data-track-owner="features/explore/theme-browse.tsx#ThemeTile:Link.1"
      ref={ref}
      to="/explore/$kind/$slug"
      params={listingParams(card)}
      className="group flex min-w-0 flex-col gap-3 rounded-(--radius-panel) outline-none focus-visible:outline-ring-inset"
    >
      <ThemeCover
        card={card}
        visible={visible}
        className={themeStageClassName(wallpaper)}
      >
        {visible && (
          <ThemeStage
            wallpaper={wallpaper}
            palette={dark ? card.theme.dark : card.theme.light}
            dark={dark}
            lift
          />
        )}
      </ThemeCover>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon?.(card)}
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {card.displayName}
        </span>
        <span className="shrink-0 text-sm text-muted-foreground-2">
          {makerName(card)}
        </span>
      </div>
    </Link>
  );
}

export type ThemeGridProps = {
  cards: ReadonlyArray<ThemeListingCard>;
  icon?: ThemeCardSlot;
};

export function ThemeGrid({ cards, icon }: ThemeGridProps) {
  return (
    <div className={GRID_CLASS_NAME}>
      {cards.map((card) => (
        <ThemeTile key={card.slug} card={card} icon={icon} />
      ))}
    </div>
  );
}

export type FeaturedProps = {
  card: ThemeListingCard;
  addAction?: ThemeCardSlot;
};

export function Featured({ card, addAction }: FeaturedProps) {
  const dark = useDarkMode();
  const wallpaper = useCoverWallpaper(card, true);
  if (card.theme === null) return null;
  return (
    <section className="overflow-hidden rounded-(--radius-panel) border-(length:--border-width-hairline) border-border-1 bg-card shadow-card">
      <ThemeCover
        card={card}
        visible
        className={cx(
          themeStageClassName(wallpaper),
          "rounded-none border-0 border-b-(length:--border-width-hairline) sm:aspect-[2/1]",
        )}
      >
        <ThemeStage
          wallpaper={wallpaper}
          palette={dark ? card.theme.dark : card.theme.light}
          dark={dark}
        />
      </ThemeCover>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground-2">
          {card.featuredRank === null ? "Community pick" : "Featured"}
        </span>
        <h2 className="text-lg font-medium text-foreground">
          {card.displayName}
        </h2>
        <p className="line-clamp-2 text-sm text-muted-foreground-1">
          {trimDescription(card.description)}
        </p>
        <p className="text-sm text-muted-foreground-2">
          {themeByline(makerName(card), card.adds, formatCount)}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {addAction?.(card)}
          <Button
            data-track-owner="features/explore/theme-browse.tsx#Featured:Button[Details]"
            variant="ghost"
            size="base"
            render={
              <Link
                data-track-owner="features/explore/theme-browse.tsx#Featured:Link.1"
                to="/explore/$kind/$slug"
                params={listingParams(card)}
              />
            }
          >
            Details
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PublishYours() {
  const { signedIn } = useExploreSession();
  if (signedIn)
    return (
      <Button
        data-track-owner="features/explore/theme-browse.tsx#PublishYours:Button[Publish yours]"
        variant="ghost"
        size="sm"
        className="shrink-0"
        render={
          <Link
            data-track-owner="features/explore/theme-browse.tsx#PublishYours:Link.1"
            to="/settings/appearance/themes"
          />
        }
      >
        <Icon name="plus-large" />
        Publish yours
      </Button>
    );
  return (
    <SignInButton
      data-track-owner="features/explore/theme-browse.tsx#PublishYours:SignInLink[Publish yours]"
      variant="ghost"
      className="shrink-0"
    >
      <Icon name="plus-large" />
      Publish yours
    </SignInButton>
  );
}

export type ThemeBrowseProps = {
  cards: ReadonlyArray<ThemeListingCard>;
  search: ThemeBrowseSearch;
  onSearch: (search: ThemeBrowseSearch) => void;
  addAction?: ThemeCardSlot;
  icon?: ThemeCardSlot;
};

export function ThemeBrowse({
  cards,
  search,
  onSearch,
  addAction,
  icon,
}: ThemeBrowseProps) {
  const onPage = (page: number) =>
    onSearch({ ...search, page: page === 1 ? undefined : page });
  const layout = arrangeThemes(cards, search);
  if (layout.kind === "search")
    return (
      <>
        <ThemeGrid cards={layout.cards} icon={icon} />
        <Pager current={layout.current} pages={layout.pages} onPage={onPage} />
      </>
    );
  return (
    <>
      {layout.featured !== undefined && (
        <Featured card={layout.featured} addAction={addAction} />
      )}
      {layout.popular.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-foreground">Popular</h2>
          <ThemeGrid cards={layout.popular} icon={icon} />
        </section>
      )}
      {layout.byCapy.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-medium text-foreground">By Capy</h2>
          <ThemeGrid cards={layout.byCapy} icon={icon} />
        </section>
      )}
      {layout.showCommunity && (
        <section className="flex flex-col gap-4">
          <div className="flex items-end gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="text-base font-medium text-foreground">
                Community themes
              </h2>
              <p className="text-sm text-muted-foreground-2">
                Made and shared by people using Capy
              </p>
            </div>
            <PublishYours />
          </div>
          {layout.community.length === 0 ? (
            <p className="text-sm text-muted-foreground-2">
              {layout.communityEmpty}
            </p>
          ) : (
            <ThemeGrid cards={layout.community} icon={icon} />
          )}
        </section>
      )}
      <Pager current={layout.current} pages={layout.pages} onPage={onPage} />
    </>
  );
}
