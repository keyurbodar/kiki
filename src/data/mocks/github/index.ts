import { Effect, Ref } from "effect";
import { MockDb, notFound } from "../db/MockDb.ts";
import { orgId as sampleOrgId } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleSecondaryGitHubAccount } from "./fixtures.ts";

export const GithubMock = mockGroup("github", (handlers) =>
  Effect.gen(function* () {
    const { repos } = yield* MockDb;
    const secondaryAccount = yield* Ref.make(sampleSecondaryGitHubAccount);

    const checkOrg = (params: { readonly orgId: string }) =>
      params.orgId === sampleOrgId
        ? Effect.void
        : notFound("members", params.orgId);

    return handlers
      .handle("listDependencyReaderRepos", ({ params }) =>
        Effect.gen(function* () {
          yield* checkOrg(params);
          const rows = yield* Ref.get(repos);
          return rows.map((repo, index) => ({
            id: repo.id,
            fullName: repo.fullName,
            private: repo.private,
            defaultBranch: repo.defaultBranch,
            language: repo.language,
            selected: index < 3,
          }));
        }),
      )
      .handle("getGitHubSecondary", ({ params }) =>
        Effect.gen(function* () {
          yield* checkOrg(params);
          return yield* Ref.get(secondaryAccount);
        }),
      )
      .handle("disconnectGitHubSecondary", ({ params }) =>
        Effect.gen(function* () {
          yield* checkOrg(params);
          const disconnected = {
            ...(yield* Ref.get(secondaryAccount)),
            connected: false,
          };
          yield* Ref.set(secondaryAccount, disconnected);
          return { ok: true };
        }),
      );
  }),
);
