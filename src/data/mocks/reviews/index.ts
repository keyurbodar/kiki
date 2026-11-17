import { Effect, Ref } from "effect";
import { fields, MockDb } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  sampleRepos,
  sampleReviewerIds,
  sampleSelfAuthorPolicy,
  sampleSettings,
  updatedAt,
} from "./fixtures.ts";

type Settings = Record<string, unknown>;

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const number = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const patchFrom = (
  input: Record<string, unknown>,
  current: Record<string, unknown>,
) => ({
  ...current,
  ...(input.autoReviewEnabled === undefined
    ? {}
    : { autoReviewEnabled: flag(input.autoReviewEnabled, false) }),
  ...(input.reviewOnDraft === undefined
    ? {}
    : { reviewOnDraft: flag(input.reviewOnDraft, false) }),
  ...(input.dismissStaleReviews === undefined
    ? {}
    : { dismissStaleReviews: flag(input.dismissStaleReviews, false) }),
  ...(input.reviewerCount === undefined
    ? {}
    : { reviewerCount: number(input.reviewerCount, 1) }),
  ...(input.model === undefined ? {} : { model: text(input.model, "") }),
  ...(input.instructions === undefined
    ? {}
    : { instructions: text(input.instructions, "") }),
  ...(Array.isArray(input.reviewerIds)
    ? { reviewerIds: input.reviewerIds.filter((id) => typeof id === "string") }
    : {}),
  ...(Array.isArray(input.repoIds)
    ? { repoIds: input.repoIds.filter((id) => typeof id === "string") }
    : {}),
  updatedAt: updatedAt(),
});

export const ReviewsMock = mockGroup("reviews", (handlers) =>
  Effect.gen(function* () {
    const { members } = yield* MockDb;
    const policy = yield* Ref.make<Record<string, unknown>>({
      ...sampleSelfAuthorPolicy,
    });
    const settings = yield* Ref.make<Settings>({
      ...sampleSettings,
      reviewerIds: sampleReviewerIds,
      repoIds: sampleRepos.slice(0, 2).map((repo) => repo.id),
    });

    return handlers
      .handle("getSelfAuthorPolicy", () => Ref.get(policy))
      .handle("setSelfAuthorPolicy", ({ payload }) => {
        const input = fields(payload);
        return Ref.update(policy, (current) => ({
          ...current,
          ...(input.allowSelfReview === undefined
            ? {}
            : { allowSelfReview: flag(input.allowSelfReview, false) }),
          ...(input.requireReviewFromOwner === undefined
            ? {}
            : {
                requireReviewFromOwner: flag(
                  input.requireReviewFromOwner,
                  false,
                ),
              }),
          updatedAt: updatedAt(),
        })).pipe(Effect.flatMap(() => Ref.get(policy)));
      })
      .handle("listSettings", () =>
        Effect.gen(function* () {
          const current = yield* Ref.get(settings);
          const people = yield* Ref.get(members);
          return {
            ...current,
            reviewers: (current.reviewerIds as ReadonlyArray<string>).map(
              (id) => people.find((person) => person.id === id) ?? { id },
            ),
          };
        }),
      )
      .handle("configure", ({ payload }) =>
        Ref.update(settings, (current) => patchFrom(fields(payload), current))
          .pipe(Effect.flatMap(() => Ref.get(settings)))
          .pipe(
            Effect.map((current) => ({
              ...current,
              repoNames: sampleRepos
                .filter((repo) =>
                  (current.repoIds as ReadonlyArray<string>).includes(repo.id),
                )
                .map((repo) => repo.fullName),
            })),
          ),
      );
  }),
);
