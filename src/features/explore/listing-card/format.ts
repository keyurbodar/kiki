export const LISTING_KIND_PATHS = {
  plugin: "plugins",
  skill: "skills",
  theme: "themes",
} as const;

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const formatListingCount = (count: number) =>
  compactNumber.format(count).toLowerCase();

export const formatListingDate = (date: Date | number) =>
  shortDate.format(date);

export const trimDescription = (description: string) =>
  description.replace(/\.$/, "");

export const listingParams = (card: {
  kind: keyof typeof LISTING_KIND_PATHS;
  slug: string;
}) => ({
  kind: LISTING_KIND_PATHS[card.kind],
  slug: card.slug,
});

export const listingByline = (card: {
  kind: keyof typeof LISTING_KIND_PATHS;
  builtIn: unknown;
  maker: { readonly name: string } | null;
}) => {
  if (card.builtIn !== null) return "Built in";
  if (card.maker !== null) return card.maker.name;
  return card.kind === "theme" ? "Capy" : undefined;
};

export const listingAdds = (adds: number) =>
  `${formatListingCount(adds)} ${adds === 1 ? "add" : "adds"}`;

export const listingStarsTitle = (checkedAt: Date | number | null) =>
  checkedAt === null
    ? "GitHub stars"
    : `GitHub stars, checked ${formatListingDate(checkedAt)}`;
