import { ExploreCard, type PluginCategory } from "../../api/schemas/explore.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people, presetThemeIds } from "../fixtures/world.ts";

export type ListingKind = "plugin" | "skill" | "theme";

export interface PublicListing {
  readonly kind: ListingKind;
  readonly slug: string;
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly authorId: string;
  readonly icon: { readonly url: string; readonly mimeType: string };
  readonly wallpaper: { readonly url: string; readonly mimeType: string };
  readonly featured: boolean;
  readonly installs: number;
  readonly rating: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const iconUrl = (kind: ListingKind, slug: string) =>
  `https://icons.example.com/explore/${kind}/${slug}.png`;

const wallpaperUrl = (slug: string) =>
  `https://wallpapers.example.com/themes/${slug}.png`;

const listing = (
  kind: ListingKind,
  slug: string,
  displayName: string,
  description: string,
  authorId: string,
  featured: boolean,
  installs: number,
  rating: number,
  updatedMinutesAgo: number,
): PublicListing => ({
  kind,
  slug,
  name: slug,
  displayName,
  description,
  authorId,
  icon: { url: iconUrl(kind, slug), mimeType: "image/png" },
  wallpaper: { url: wallpaperUrl(slug), mimeType: "image/png" },
  featured,
  installs,
  rating,
  createdAt: isoMinutesAgo(updatedMinutesAgo + 60 * 24),
  updatedAt: isoMinutesAgo(updatedMinutesAgo),
});

export const sampleListings: ReadonlyArray<PublicListing> = [
  listing(
    "plugin",
    "release-notes",
    "Release Notes",
    "Collects release notes from linked pull requests into a changelog.",
    people.sam.id,
    true,
    1840,
    4.8,
    45,
  ),
  listing(
    "plugin",
    "error-tracker",
    "Error Tracker",
    "Links failing requests to the thread that introduced them.",
    people.alex.id,
    true,
    920,
    4.6,
    2 * 60 * 24,
  ),
  listing(
    "plugin",
    "docs-search",
    "Docs Search",
    "Searches the project docs from the command palette.",
    people.priya.id,
    false,
    310,
    4.3,
    6 * 60 * 24,
  ),
  listing(
    "skill",
    "code-review",
    "Code Review",
    "Reviews a pull request against the project's contributing guide.",
    people.sam.id,
    true,
    2760,
    4.9,
    3 * 60,
  ),
  listing(
    "skill",
    "release-checklist",
    "Release Checklist",
    "Walks through the release steps and records each result.",
    people.alex.id,
    false,
    480,
    4.5,
    4 * 60 * 24,
  ),
  listing(
    "theme",
    presetThemeIds[0],
    "Absolutely",
    "A bright, high-contrast theme for focused work.",
    people.jordan.id,
    true,
    5120,
    4.9,
    12 * 60 * 24,
  ),
  listing(
    "theme",
    presetThemeIds[2],
    "Catppuccin",
    "A soft pastel theme with a calm palette.",
    people.casey.id,
    false,
    3910,
    4.8,
    8 * 60 * 24,
  ),
  listing(
    "theme",
    presetThemeIds[10],
    "Linear",
    "A dark, minimal theme for long sessions.",
    people.priya.id,
    false,
    2280,
    4.7,
    15 * 60 * 24,
  ),
];

export const listingKinds: ReadonlyArray<ListingKind> = [
  "plugin",
  "skill",
  "theme",
];

const day = 24 * 60;
const palette = (bg: string, panel: string, fg: string, primary: string) => ({
  "--bg": bg,
  "--panel": panel,
  "--fg": fg,
  "--primary": primary,
});

type CardInput = Partial<
  Omit<ConstructorParameters<typeof ExploreCard>[0], "kind" | "slug">
> &
  Pick<
    ConstructorParameters<typeof ExploreCard>[0],
    "displayName" | "description"
  >;

const card = (kind: ListingKind, slug: string, input: CardInput) =>
  new ExploreCard({
    kind,
    slug,
    source: "catalog",
    maker: null,
    accent: null,
    category: null,
    firstListedAt: null,
    featuredRank: null,
    hasIcon: false,
    repository: null,
    stars: null,
    starsCheckedAt: null,
    adds: null,
    version: "1.0.0",
    versionId: `ver_${kind}_${slug}`,
    theme: null,
    builtIn: null,
    createdAt: minutesAgo(60 * day),
    updatedAt: minutesAgo(2 * day),
    ...input,
  });

const plugin = (
  slug: string,
  displayName: string,
  description: string,
  category: PluginCategory,
  extra: { featuredRank?: number; listedDaysAgo?: number } = {},
) =>
  card("plugin", slug, {
    displayName,
    description,
    category,
    featuredRank: extra.featuredRank ?? null,
    firstListedAt:
      extra.listedDaysAgo === undefined
        ? null
        : minutesAgo(extra.listedDaysAgo * day),
  });

const skill = (
  slug: string,
  displayName: string,
  description: string,
  maker: string,
  stars: number,
) =>
  card("skill", slug, {
    displayName,
    description,
    maker: { name: maker },
    repository: `${maker.toLowerCase().replaceAll(" ", "-")}/skills`,
    stars,
    starsCheckedAt: minutesAgo(day),
  });

const theme = (
  slug: string,
  displayName: string,
  description: string,
  source: "catalog" | "user",
  colors: {
    light: ReturnType<typeof palette>;
    dark: ReturnType<typeof palette>;
  },
  extra: {
    featuredRank?: number;
    adds?: number;
    maker?: string;
    wallpaper?: string;
  } = {},
) =>
  card("theme", slug, {
    displayName,
    description,
    source,
    featuredRank: extra.featuredRank ?? null,
    adds: extra.adds ?? null,
    maker: extra.maker === undefined ? null : { name: extra.maker },
    theme: {
      light: colors.light,
      dark: colors.dark,
      ...(extra.wallpaper === undefined
        ? {}
        : { wallpaper: { name: extra.wallpaper } }),
    },
  });

/** Capy-shaped Explore index cards (`ExploreIndex.cards`), neutral sample data. */
export const sampleIndexCards: ReadonlyArray<ExploreCard> = [
  plugin(
    "error-tracker",
    "Error Tracker",
    "Link failing requests to the change that introduced them",
    "monitoring",
    { featuredRank: 1, listedDaysAgo: 40 },
  ),
  plugin(
    "release-notes",
    "Release Notes",
    "Collect release notes from merged pull requests",
    "docs",
    { featuredRank: 2, listedDaysAgo: 35 },
  ),
  plugin(
    "deploy-preview",
    "Deploy Preview",
    "Open a preview deployment for every branch",
    "deployment",
    { featuredRank: 3, listedDaysAgo: 30 },
  ),
  plugin(
    "docs-search",
    "Docs Search",
    "Search the project docs and cite the right page",
    "docs",
    { featuredRank: 4, listedDaysAgo: 28 },
  ),
  plugin(
    "uptime-watch",
    "Uptime Watch",
    "Check endpoints on a schedule and report outages",
    "monitoring",
    { listedDaysAgo: 1 },
  ),
  plugin(
    "schema-sync",
    "Schema Sync",
    "Compare database schemas and draft migrations",
    "database",
    { listedDaysAgo: 2 },
  ),
  plugin(
    "invoice-desk",
    "Invoice Desk",
    "Manage invoices, refunds and payment links",
    "payments",
    { listedDaysAgo: 3 },
  ),
  plugin(
    "token-studio",
    "Token Studio",
    "Export design tokens from shared libraries",
    "design",
    { listedDaysAgo: 4 },
  ),
  plugin(
    "task-board",
    "Task Board",
    "Create and update tasks from a conversation",
    "productivity",
    { listedDaysAgo: 5 },
  ),
  plugin(
    "log-search",
    "Log Search",
    "Query application logs and summarise spikes",
    "monitoring",
    { listedDaysAgo: 6 },
  ),
  plugin(
    "query-console",
    "Query Console",
    "Run read-only queries against a replica",
    "database",
    { listedDaysAgo: 12 },
  ),
  plugin(
    "status-page",
    "Status Page",
    "Post incident updates to a public status page",
    "monitoring",
    { listedDaysAgo: 20 },
  ),
  plugin(
    "cache-inspector",
    "Cache Inspector",
    "Inspect and purge cached responses",
    "deployment",
  ),
  plugin(
    "meeting-notes",
    "Meeting Notes",
    "Turn meeting transcripts into action items",
    "productivity",
  ),
  skill(
    "diagnosing-bugs",
    "Diagnosing Bugs",
    "Debug hard bugs and slow code by forming and testing hypotheses",
    "Alex Morgan",
    32600,
  ),
  skill(
    "plan-review",
    "Plan Review",
    "Stress-test a plan or design by asking pointed questions",
    "Alex Morgan",
    32600,
  ),
  skill(
    "module-design",
    "Module Design",
    "Design deep modules with a small, stable interface",
    "Alex Morgan",
    32600,
  ),
  skill(
    "session-handoff",
    "Session Handoff",
    "Compact the current session into a handoff note",
    "Alex Morgan",
    32600,
  ),
  skill(
    "container-patterns",
    "Container Patterns",
    "Write and review container files and compose stacks",
    "Sam Rivera",
    30400,
  ),
  skill(
    "cluster-patterns",
    "Cluster Patterns",
    "Write and debug production cluster manifests",
    "Sam Rivera",
    30400,
  ),
  skill(
    "interface-design",
    "Interface Design",
    "Give new or reworked UI a deliberate visual direction",
    "Acme Labs",
    19600,
  ),
  skill(
    "status-reports",
    "Status Reports",
    "Write status reports and leadership updates",
    "Acme Labs",
    19600,
  ),
  skill(
    "api-design",
    "API Design",
    "Design stable APIs and module boundaries",
    "Priya Shah",
    11800,
  ),
  skill(
    "ci-automation",
    "CI Automation",
    "Set up CI pipelines with quality gates",
    "Priya Shah",
    11800,
  ),
  skill(
    "code-simplification",
    "Code Simplification",
    "Simplify code for clarity while preserving behaviour",
    "Priya Shah",
    11800,
  ),
  skill(
    "decision-records",
    "Decision Records",
    "Record architecture decisions and their trade-offs",
    "Priya Shah",
    11800,
  ),
  theme(
    "harbor-night",
    "Harbor Night",
    "Deep navy with soft lavender accents",
    "catalog",
    {
      light: palette("#f4f5fb", "#ffffff", "#1d2033", "#5b5bd6"),
      dark: palette("#0d1020", "#151a2e", "#e6e8f5", "#9b8cff"),
    },
    { featuredRank: 1, wallpaper: "Harbor" },
  ),
  theme(
    "paper-mint",
    "Paper Mint",
    "Warm paper whites with a mint accent",
    "catalog",
    {
      light: palette("#f7f5ef", "#ffffff", "#24261f", "#2f9e78"),
      dark: palette("#151613", "#1e201b", "#ecebe4", "#5cc79f"),
    },
    { featuredRank: 2 },
  ),
  theme(
    "ember",
    "Ember",
    "Charcoal surfaces with an ember orange accent",
    "catalog",
    {
      light: palette("#faf7f5", "#ffffff", "#2a211d", "#e0662f"),
      dark: palette("#141110", "#1d1917", "#efe7e2", "#f08a4b"),
    },
    { featuredRank: 3 },
  ),
  theme(
    "glacier",
    "Glacier",
    "Cool greys with an icy blue accent",
    "user",
    {
      light: palette("#f3f6f8", "#ffffff", "#1b252c", "#3a8fd6"),
      dark: palette("#0f1418", "#172026", "#e3ebf0", "#6cb4ee"),
    },
    { adds: 1240, maker: "Jordan Lee", wallpaper: "Ice" },
  ),
  theme(
    "orchard",
    "Orchard",
    "Soft greens and a ripe apple red",
    "user",
    {
      light: palette("#f5f7f1", "#ffffff", "#20271c", "#d1453b"),
      dark: palette("#11150f", "#1a2017", "#e7ecdf", "#ef6b5f"),
    },
    { adds: 310, maker: "Casey Nguyen" },
  ),
];
