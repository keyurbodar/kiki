import { DateTime } from "effect";
import type { ReactNode } from "react";
import type { ExploreCard } from "@/data/api/schemas/explore";
import type { ExploreSearch } from "../explore-page/search";
import {
  PluginBrowse,
  type PluginBrowseCard,
  type PluginBrowseSearch,
  PluginCategories,
} from "../plugin-browse";

export type PluginRow = PluginBrowseCard & { readonly card: ExploreCard };

const listedAt = (card: ExploreCard) =>
  card.firstListedAt === null ? null : DateTime.toDate(card.firstListedAt);

export const toPluginRow = (card: ExploreCard): PluginRow => ({
  slug: card.slug,
  displayName: card.displayName,
  category: card.category ?? "other",
  builtIn: card.builtIn === null ? null : card.builtIn.settingsPath,
  featuredRank: card.featuredRank,
  firstListedAt: listedAt(card),
  card,
});

const browseSearch = (search: ExploreSearch): PluginBrowseSearch => ({
  q: search.q,
  section: search.section,
  category: search.category,
  page: search.page,
});

export const pluginSearch = (
  search: ExploreSearch,
  next: PluginBrowseSearch,
): ExploreSearch => ({
  tab: search.tab,
  q: next.q,
  section: next.section,
  category: next.category,
  page: next.page,
});

export type PluginShelvesProps = {
  cards: ReadonlyArray<ExploreCard>;
  search: ExploreSearch;
  onSearch: (search: ExploreSearch) => void;
  renderCard: (card: ExploreCard) => ReactNode;
};

export function PluginShelves({
  cards,
  search,
  onSearch,
  renderCard,
}: PluginShelvesProps) {
  return (
    <PluginBrowse
      cards={cards.map(toPluginRow)}
      search={browseSearch(search)}
      onSearch={(next) => onSearch(pluginSearch(search, next))}
      renderCard={(row) => renderCard(row.card)}
    />
  );
}

export type PluginCategoryControlProps = {
  search: ExploreSearch;
  onSearch: (search: ExploreSearch) => void;
};

export function PluginCategoryControl({
  search,
  onSearch,
}: PluginCategoryControlProps) {
  return (
    <PluginCategories
      onSearch={(next) => onSearch(pluginSearch(search, next))}
    />
  );
}
