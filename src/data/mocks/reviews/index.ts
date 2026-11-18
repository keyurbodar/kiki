import { Effect, Ref } from "effect";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { fields } from "../db/MockDb.ts";
import { orgId } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type AutoReviewMode,
  sampleReviewSettings,
  sampleSelfPolicy,
} from "./fixtures.ts";

const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const modes: ReadonlyArray<AutoReviewMode> = ["off", "once", "always"];
const mode = (value: unknown, fallback: AutoReviewMode) =>
  modes.find((candidate) => candidate === value) ?? fallback;

export const ReviewsMock = mockGroup("reviews", (handlers) =>
  Effect.gen(function* () {
    const settings = yield* Ref.make(
      sampleReviewSettings.map((row) => ({ ...row })),
    );
    const selfPolicy = yield* Ref.make({ ...sampleSelfPolicy });

    return handlers
      .handle("listSettings", () => Ref.get(settings))
      .handle("configure", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const repo = text(input.repo);
          if (repo === undefined) {
            return yield* Effect.fail(
              new InvalidRequest({
                message: "A review setting needs a repo",
              }),
            );
          }
          let updated: (typeof sampleReviewSettings)[number] | undefined;
          yield* Ref.update(settings, (rows) =>
            rows.map((row) => {
              if (row.repo !== repo) return row;
              const autoReview = mode(input.autoReview, row.autoReview);
              const claims = autoReview !== "off" && row.billingOrgId === null;
              updated = {
                ...row,
                autoReview,
                billingOrgId: claims ? orgId : row.billingOrgId,
                heldByCaller: claims || row.heldByCaller,
                postInvestigate: flag(
                  input.postInvestigate,
                  row.postInvestigate,
                ),
                postNotes: flag(input.postNotes, row.postNotes),
                postStatusCheck: flag(
                  input.postStatusCheck,
                  row.postStatusCheck,
                ),
                postingThreshold:
                  text(input.postingThreshold) ?? row.postingThreshold,
                projectId:
                  input.projectId === null
                    ? null
                    : (text(input.projectId) ?? row.projectId),
              };
              return updated;
            }),
          );
          if (updated === undefined) {
            return yield* Effect.fail(
              new InvalidRequest({
                message: `No review settings for ${repo}`,
              }),
            );
          }
          return updated;
        }),
      )
      .handle("getSelfAuthorPolicy", () => Ref.get(selfPolicy))
      .handle("setSelfAuthorPolicy", ({ payload }) =>
        Effect.gen(function* () {
          const reviewed = flag(fields(payload).reviewed, false);
          yield* Ref.set(selfPolicy, {
            ...sampleSelfPolicy,
            selfReviewed: reviewed,
          });
          return yield* Ref.get(selfPolicy);
        }),
      );
  }),
);
