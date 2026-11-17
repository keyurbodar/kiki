import { isoMinutesAgo, type Person, people } from "../fixtures/world.ts";

export interface ExploreVersion {
  readonly version: string;
  readonly versionId: string;
  readonly changelog: string;
  readonly publishedAt: string;
}

export interface ExploreListing {
  readonly kind: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly tags: ReadonlyArray<string>;
  readonly versions: ReadonlyArray<ExploreVersion>;
  readonly repository?: string;
  readonly updatedAt: string;
}

const hour = 60;
const day = 24 * hour;

const listing = (
  kind: string,
  slug: string,
  displayName: string,
  description: string,
  author: Person,
  tags: ReadonlyArray<string>,
  version: string,
  publishedMinutesAgo: number,
  repository?: string,
): ExploreListing => ({
  kind,
  slug,
  displayName,
  description,
  authorId: author.id,
  authorName: `${author.firstName} ${author.lastName}`,
  tags,
  versions: [
    {
      version,
      versionId: `${slug}-${version}`,
      changelog: `Initial community release of ${displayName}.`,
      publishedAt: isoMinutesAgo(publishedMinutesAgo),
    },
  ],
  ...(repository === undefined ? {} : { repository }),
  updatedAt: isoMinutesAgo(publishedMinutesAgo),
});

export const communityListings: ReadonlyArray<ExploreListing> = [
  listing(
    "plugin",
    "release-notes",
    "Release Notes",
    "Collects release notes from linked issues and pull requests.",
    people.alex,
    ["releases", "productivity"],
    "1.2.0",
    3 * day,
    "acme/web",
  ),
  listing(
    "plugin",
    "thread-digest",
    "Thread Digest",
    "Posts a short summary when a thread reaches a decision.",
    people.sam,
    ["summaries", "threads"],
    "0.8.1",
    6 * day,
    "acme/api",
  ),
  listing(
    "skill",
    "docs-review",
    "Docs Review",
    "Checks documentation changes against the public API.",
    people.priya,
    ["docs", "review"],
    "2.0.0",
    9 * day,
    "acme/docs",
  ),
  listing(
    "theme",
    "terminal-paper",
    "Terminal Paper",
    "A quiet, high-contrast theme for long reading sessions.",
    people.jordan,
    ["theme", "high-contrast"],
    "1.0.0",
    12 * day,
  ),
  listing(
    "sprite",
    "desk-light",
    "Desk Light",
    "A small desk lamp sprite for canvas scenes.",
    people.casey,
    ["sprite", "scene"],
    "0.4.0",
    18 * day,
  ),
];

export const listingKinds: ReadonlyArray<string> = [
  "plugin",
  "skill",
  "theme",
  "sprite",
];
