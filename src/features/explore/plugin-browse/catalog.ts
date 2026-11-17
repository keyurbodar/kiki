export const PLUGIN_CATEGORIES = [
  "monitoring",
  "deployment",
  "database",
  "docs",
  "design",
  "payments",
  "productivity",
  "other",
] as const;

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number];

export const PLUGIN_CATEGORY_LABELS: Record<PluginCategory, string> = {
  monitoring: "Monitoring",
  deployment: "Deployment",
  database: "Database",
  docs: "Docs",
  design: "Design",
  payments: "Payments",
  productivity: "Productivity",
  other: "Other",
};

export const SHELF_SIZE = 6;
export const PAGE_SIZE = 24;

export type PluginBrowseCard = {
  slug: string;
  displayName: string;
  category: PluginCategory;
  builtIn: string | null;
  featuredRank: number | null;
  firstListedAt: Date | null;
};

export type PluginBrowseSearch = {
  q?: string;
  section?: "featured" | "recent";
  category?: PluginCategory;
  page?: number;
};

export type PluginShelfModel<Card> = {
  title: string;
  cards: Card[];
  viewAll?: PluginBrowseSearch;
};

export type PluginBrowseView<Card> =
  | {
      kind: "empty";
      art: "sleep" | "peer";
      line: string;
      sub: string;
      action: string;
    }
  | {
      kind: "results";
      title: string;
      cards: Card[];
      page: number;
      pages: number;
    }
  | { kind: "shelves"; shelves: PluginShelfModel<Card>[] };

const byFeaturedRank = (a: PluginBrowseCard, b: PluginBrowseCard) =>
  (a.featuredRank ?? 0) - (b.featuredRank ?? 0) || a.slug.localeCompare(b.slug);

const byNewest = (a: PluginBrowseCard, b: PluginBrowseCard) =>
  (b.firstListedAt?.getTime() ?? -1) - (a.firstListedAt?.getTime() ?? -1) ||
  a.slug.localeCompare(b.slug);

const sectionTitle = (search: PluginBrowseSearch) => {
  if (search.q !== undefined) return "Search results";
  if (search.section === "featured") return "Featured";
  if (search.section === "recent") return "Recently added";
  return search.category === undefined
    ? ""
    : PLUGIN_CATEGORY_LABELS[search.category];
};

const emptyLine = (search: PluginBrowseSearch) => {
  if (search.section === "recent") return "No new plugins yet";
  if (search.section === "featured") return "No featured plugins yet";
  const label =
    search.category === undefined
      ? ""
      : PLUGIN_CATEGORY_LABELS[search.category];
  return `No ${label.toLowerCase()} plugins yet`;
};

export function browsePlugins<Card extends PluginBrowseCard>(
  cards: readonly Card[],
  search: PluginBrowseSearch,
): PluginBrowseView<Card> {
  const listed = cards.filter((card) => card.builtIn === null);
  const newest = listed.toSorted(byNewest);
  const featured = listed
    .filter((card) => card.featuredRank !== null)
    .toSorted(byFeaturedRank);
  const recent = newest.filter((card) => card.firstListedAt !== null);
  const narrowed =
    search.q !== undefined ||
    search.section !== undefined ||
    search.category !== undefined;

  if (!narrowed) {
    const integrations = cards.filter((card) => card.builtIn !== null);
    return {
      kind: "shelves",
      shelves: [
        ...(featured.length > 0
          ? [
              {
                title: "Featured",
                cards: featured.slice(0, 4),
                viewAll: { section: "featured" as const },
              },
            ]
          : []),
        {
          title: "Recently added",
          cards: recent.slice(0, SHELF_SIZE),
          viewAll: { section: "recent" },
        },
        ...PLUGIN_CATEGORIES.flatMap((category) => {
          const inCategory = newest.filter(
            (card) => card.category === category,
          );
          return inCategory.length === 0
            ? []
            : [
                {
                  title: PLUGIN_CATEGORY_LABELS[category],
                  cards: inCategory.slice(0, SHELF_SIZE),
                  viewAll: { category },
                },
              ];
        }),
        ...(integrations.length > 0
          ? [{ title: "Integrations", cards: integrations }]
          : []),
      ],
    };
  }

  const matches =
    search.q !== undefined
      ? [...cards]
      : search.section === "featured"
        ? featured
        : search.section === "recent"
          ? recent
          : newest.filter((card) => card.category === search.category);

  if (matches.length === 0) {
    return search.q === undefined
      ? {
          kind: "empty",
          art: "sleep",
          line: emptyLine(search),
          sub: "Newly listed plugins appear here",
          action: "All plugins",
        }
      : {
          kind: "empty",
          art: "peer",
          line: "No plugins match that search",
          sub: "Try another word or clear the search",
          action: "Clear search",
        };
  }

  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(search.page ?? 1, pages);
  return {
    kind: "results",
    title: sectionTitle(search),
    cards: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    pages,
  };
}
