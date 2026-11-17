import { DateTime, Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  communityListings,
  type ExploreListing,
  listingKinds,
} from "./fixtures.ts";

interface ReportReceipt {
  readonly ok: true;
  readonly id: string;
  readonly createdAt: string;
}

interface InstalledSkill {
  readonly id: string;
  readonly kind: "skill";
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly version: string;
  readonly installedAt: string;
}

const one = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};

const stringField = (input: Record<string, unknown>, key: string) => {
  const value = one(input[key]);
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const listingMatches = (
  listing: ExploreListing,
  query: Record<string, unknown>,
) => {
  const kind = stringField(query, "kind");
  const search = stringField(query, "search") ?? stringField(query, "q");
  if (kind !== undefined && listing.kind !== kind) return false;
  if (search === undefined) return true;
  const needle = search.toLowerCase();
  return [
    listing.displayName,
    listing.description,
    listing.slug,
    ...listing.tags,
  ].some((value) => value.toLowerCase().includes(needle));
};

export const ExploreMock = mockGroup("explore", (handlers) =>
  Effect.gen(function* () {
    const reports = yield* Ref.make<ReadonlyArray<ReportReceipt>>([]);
    const skills = yield* Ref.make<ReadonlyArray<InstalledSkill>>([]);
    const hiddenThemes = yield* Ref.make<ReadonlyArray<string>>([]);

    return handlers
      .handle("listings", ({ query }) => {
        const input = fields(query);
        const kind = stringField(input, "kind");
        if (kind !== undefined && !listingKinds.includes(kind)) {
          return Effect.die(
            new Error(`Explore.listings: unknown kind ${kind}`),
          );
        }
        const rows = communityListings.filter((listing) =>
          listingMatches(listing, input),
        );
        return Effect.succeed(rows);
      })
      .handle("report", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const slug = stringField(input, "slug");
          if (
            slug === undefined ||
            !communityListings.some((row) => row.slug === slug)
          ) {
            return yield* Effect.die(
              new Error(`Explore.listings: no listing ${slug ?? "unknown"}`),
            );
          }
          const receipt: ReportReceipt = {
            id: newId("rpt"),
            ok: true,
            createdAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.update(reports, (rows) => [...rows, receipt]);
          return receipt;
        }),
      )
      .handle("themeVisibility", ({ params }) =>
        Ref.get(hiddenThemes).pipe(
          Effect.map((hidden) => ({ hidden: hidden.includes(params.slug) })),
        ),
      )
      .handle("setThemeVisibility", ({ params, payload }) => {
        const hidden = fields(payload).hidden === true;
        return Ref.updateAndGet(hiddenThemes, (slugs) =>
          hidden
            ? slugs.includes(params.slug)
              ? slugs
              : [...slugs, params.slug]
            : slugs.filter((slug) => slug !== params.slug),
        ).pipe(
          Effect.map((slugs) => ({ hidden: slugs.includes(params.slug) })),
        );
      })
      .handle("addSkill", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const slug = stringField(input, "slug");
          const listing = communityListings.find((row) => row.slug === slug);
          if (!listing) {
            return yield* Effect.die(
              new Error(`Explore.listings: no listing ${slug ?? "unknown"}`),
            );
          }
          if (listing.kind !== "skill") {
            return yield* Effect.die(
              new Error(`Explore.listings: ${listing.slug} is not a skill`),
            );
          }
          const skill: InstalledSkill = {
            id: newId("skill"),
            kind: "skill",
            slug: listing.slug,
            displayName: listing.displayName,
            description: listing.description,
            version:
              stringField(input, "version") ??
              listing.versions[0]?.version ??
              "1.0.0",
            installedAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.update(skills, (rows) => [
            ...rows.filter((row) => row.slug !== skill.slug),
            skill,
          ]);
          return skill;
        }),
      );
  }),
);
