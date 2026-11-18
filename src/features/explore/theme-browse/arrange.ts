import type { ThemeListingCard } from "../theme-detail";

export const THEME_PAGE_SIZE = 12;

/** How many cards Capy's Popular section draws. */
export const POPULAR_SIZE = 4;

export type ThemeBrowseSearch = { readonly q?: string; readonly page?: number };

export const pageWindow = (total: number, page: number) => {
  const pages = Math.max(1, Math.ceil(total / THEME_PAGE_SIZE));
  return { pages, current: Math.min(page, pages) };
};

const pageSlice = <A>(items: ReadonlyArray<A>, current: number) =>
  items.slice((current - 1) * THEME_PAGE_SIZE, current * THEME_PAGE_SIZE);

const byFeaturedRank = (a: ThemeListingCard, b: ThemeListingCard) =>
  (a.featuredRank ?? Number.MAX_SAFE_INTEGER) -
  (b.featuredRank ?? Number.MAX_SAFE_INTEGER);

const byAddsDescending = (a: ThemeListingCard, b: ThemeListingCard) =>
  (b.adds ?? 0) - (a.adds ?? 0);

const byPopularRank = (a: ThemeListingCard, b: ThemeListingCard) =>
  (a.popularRank ?? Number.MAX_SAFE_INTEGER) -
  (b.popularRank ?? Number.MAX_SAFE_INTEGER);

export type ThemeBrowseLayout =
  | {
      readonly kind: "search";
      readonly cards: ReadonlyArray<ThemeListingCard>;
      readonly pages: number;
      readonly current: number;
    }
  | {
      readonly kind: "browse";
      readonly featured: ThemeListingCard | undefined;
      /** Capy's Popular pass: the server's ranking, drawn above By Capy and repeating those cards. */
      readonly popular: ReadonlyArray<ThemeListingCard>;
      readonly byCapy: ReadonlyArray<ThemeListingCard>;
      readonly community: ReadonlyArray<ThemeListingCard>;
      readonly showCommunity: boolean;
      readonly communityEmpty: string;
      readonly pages: number;
      readonly current: number;
    };

export function arrangeThemes(
  cards: ReadonlyArray<ThemeListingCard>,
  search: ThemeBrowseSearch,
): ThemeBrowseLayout {
  const themes = cards.filter((card) => card.theme !== null);
  if (search.q !== undefined) {
    const { pages, current } = pageWindow(themes.length, search.page ?? 1);
    return {
      kind: "search",
      cards: pageSlice(themes, current),
      pages,
      current,
    };
  }
  const community = themes.filter((card) => card.source === "user");
  const capy = themes
    .filter((card) => card.source !== "user")
    .toSorted(byFeaturedRank);
  const featured =
    capy.find((card) => card.featuredRank !== null) ??
    community
      .filter((card) => card.theme?.wallpaper !== undefined)
      .toSorted(byAddsDescending)[0];
  const popular = themes
    .filter((card) => card.popularRank !== null && card !== featured)
    .toSorted(byPopularRank)
    .slice(0, POPULAR_SIZE);
  const rest = [...capy, ...community].filter((card) => card !== featured);
  const { pages, current } = pageWindow(rest.length, search.page ?? 1);
  const page = pageSlice(rest, current);
  const communityPage = page.filter((card) => card.source === "user");
  return {
    kind: "browse",
    featured: current === 1 ? featured : undefined,
    popular: current === 1 ? popular : [],
    byCapy: page.filter((card) => card.source !== "user"),
    community: communityPage,
    showCommunity: current === 1 || communityPage.length > 0,
    communityEmpty:
      featured?.source === "user"
        ? "No other community themes yet"
        : "No community themes yet",
    pages,
    current,
  };
}

export const themeByline = (
  maker: string | undefined,
  adds: number | null,
  format: (n: number) => string,
) =>
  adds === null || adds === 0
    ? `By ${maker}`
    : `By ${maker}, added ${format(adds)} ${adds === 1 ? "time" : "times"}`;
