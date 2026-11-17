import { Effect, Ref } from "effect";
import {
  AddSkillResult,
  type ExploreCard,
  ExploreIndex,
  ExploreNotFound,
  listingKey,
} from "../../api/schemas/explore.ts";
import { MockDb } from "../db/MockDb.ts";
import {
  findSampleListing,
  sampleListings,
} from "../explorePublic/fixtures.ts";
import { mockGroup } from "../mockGroup.ts";

const listingKinds: ReadonlyArray<string> = ["plugin", "skill", "theme"];

const one = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};

const stringField = (input: Record<string, unknown>, key: string) => {
  const value = one(input[key]);
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const cardMatches = (card: ExploreCard, query: Record<string, unknown>) => {
  const kind = stringField(query, "kind");
  const search = stringField(query, "search") ?? stringField(query, "q");
  if (kind !== undefined && card.kind !== kind) return false;
  if (search === undefined) return true;
  const needle = search.toLowerCase();
  return [
    card.displayName,
    card.description,
    card.slug,
    card.category ?? "",
  ].some((value) => value.toLowerCase().includes(needle));
};

export const ExploreMock = mockGroup("explore", (handlers) =>
  Effect.gen(function* () {
    const { hiddenThemes } = yield* MockDb;
    const added = yield* Ref.make<ReadonlyArray<string>>([]);
    const reports = yield* Ref.make(0);
    return handlers
      .handle("listings", ({ query }) => {
        const kind = stringField(query, "kind");
        if (kind !== undefined && !listingKinds.includes(kind)) {
          return Effect.die(
            new Error(`Explore.listings: unknown kind ${kind}`),
          );
        }
        return Ref.get(added).pipe(
          Effect.map(
            (keys) =>
              new ExploreIndex({
                cards: sampleListings
                  .map((listing) => listing.card)
                  .filter((card) => cardMatches(card, query)),
                added: keys,
                updates: [],
              }),
          ),
        );
      })
      .handle("report", ({ payload }) =>
        findSampleListing(payload.kind, payload.slug) === undefined
          ? Effect.fail(
              new ExploreNotFound({ kind: payload.kind, slug: payload.slug }),
            )
          : Ref.update(reports, (count) => count + 1),
      )
      .handle("themeVisibility", ({ params }) =>
        Ref.get(hiddenThemes).pipe(
          Effect.map((hidden) => ({ hidden: hidden.includes(params.slug) })),
        ),
      )
      .handle("setThemeVisibility", ({ params, payload }) =>
        Ref.updateAndGet(hiddenThemes, (slugs) =>
          payload.hidden
            ? slugs.includes(params.slug)
              ? slugs
              : [...slugs, params.slug]
            : slugs.filter((slug) => slug !== params.slug),
        ).pipe(Effect.map((slugs) => ({ hidden: slugs.includes(params.slug) }))),
      )
      .handle("addSkill", ({ payload }) => {
        const listing = findSampleListing("skill", payload.slug);
        if (listing === undefined)
          return Effect.fail(
            new ExploreNotFound({ kind: "skill", slug: payload.slug }),
          );
        const key = listingKey(listing.card);
        return Ref.modify(added, (keys) => [
          new AddSkillResult({
            name:
              listing.content.kind === "skill"
                ? listing.content.skill.name
                : listing.card.slug,
            versionId: listing.card.versionId,
            replaced: keys.includes(key),
          }),
          keys.includes(key) ? keys : [...keys, key],
        ]);
      });
  }),
);
