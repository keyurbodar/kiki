import { Effect, Ref } from "effect";
import { fields, MockDb, notFound } from "../db/MockDb.ts";
import { orgId, branches as worldBranches } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { repoBranch, sampleRepoTrees, sampleSkills } from "./fixtures.ts";

const first = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const head = value[0];
    if (typeof head === "string") return head;
  }
  return undefined;
};

export const ReposMock = mockGroup("repos", (handlers) =>
  Effect.gen(function* () {
    const { repos } = yield* MockDb;
    const skills = yield* Ref.make<ReadonlyArray<unknown>>(sampleSkills);
    const tree = yield* Ref.make<ReadonlyArray<unknown>>(sampleRepoTrees);

    const repoFor = (input: Record<string, unknown>) => {
      const fullName =
        first(input.repoFullName) ??
        first(input.repo) ??
        first(input.fullName) ??
        first(input.repository);
      const id = first(input.repoId) ?? first(input.id);
      return Effect.gen(function* () {
        const rows = yield* Ref.get(repos);
        const found =
          rows.find(
            (row) => fullName !== undefined && row.fullName === fullName,
          ) ?? rows.find((row) => id !== undefined && row.id === id);
        if (!found) {
          return yield* notFound("repos", fullName ?? id ?? "unspecified");
        }
        return found;
      });
    };

    const checkOrg = (input: Record<string, unknown>) =>
      input.orgId === undefined || first(input.orgId) === orgId
        ? Effect.void
        : notFound("repos", first(input.orgId) ?? "unspecified");

    return handlers
      .handle("branches", ({ query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          yield* checkOrg(input);
          const name = first(input.branch) ?? first(input.name);
          const rows = yield* Ref.get(repos);
          const selected =
            input.repoFullName === undefined &&
            input.repo === undefined &&
            input.fullName === undefined &&
            input.repository === undefined &&
            input.repoId === undefined &&
            input.id === undefined
              ? rows
              : [yield* repoFor(input)];
          return selected
            .flatMap((repo) =>
              worldBranches.map((branchName) => repoBranch(repo, branchName)),
            )
            .filter((branch) => name === undefined || branch.name === name);
        }),
      )
      .handle("skills", ({ query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          yield* checkOrg(input);
          const search = first(input.search)?.toLowerCase();
          const selected = yield* repoFor(input);
          return (yield* Ref.get(skills)).filter((skill) => {
            const record = skill as {
              readonly repoId: string;
              readonly name: string;
              readonly description: string;
            };
            return (
              record.repoId === selected.id &&
              (search === undefined ||
                record.name.toLowerCase().includes(search) ||
                record.description.toLowerCase().includes(search))
            );
          });
        }),
      )
      .handle("tree", ({ query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          yield* checkOrg(input);
          const selected = yield* repoFor(input);
          const path = first(input.path) ?? first(input.prefix) ?? "";
          const normalized = path.replace(/^\/+|\/+$/g, "");
          return (yield* Ref.get(tree)).filter((node) => {
            const record = node as {
              readonly repoId: string;
              readonly parentPath: string;
              readonly path: string;
            };
            return (
              record.repoId === selected.id &&
              (normalized === ""
                ? record.parentPath === ""
                : record.parentPath === normalized)
            );
          });
        }),
      );
  }),
);
