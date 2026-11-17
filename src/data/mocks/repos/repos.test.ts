import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, projects } from "../fixtures/world.ts";

interface Branch {
  readonly repoFullName: string;
  readonly name: string;
  readonly isDefault: boolean;
  readonly lastCommit: { readonly message: string };
}

interface Skill {
  readonly name: string;
  readonly description: string;
  readonly sourceRepo: string;
}

interface TreeNode {
  readonly name: string;
  readonly path: string;
  readonly type: "file" | "directory";
  readonly size: number;
}

const key = `repos:${orgId}`;
const repo = "acme/web";

const branchesAtom = ApiClient.query("repos", "branches", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const skillsAtom = ApiClient.query("repos", "skills", {
  params: { orgId },
  query: { repoFullName: repo },
  reactivityKeys: [key],
});
const treeAtom = ApiClient.query("repos", "tree", {
  params: { orgId },
  query: { repoFullName: repo, path: "" },
  reactivityKeys: [key],
});

describe("repos mock", () => {
  it.effect("lists branches for the org's repositories", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const branches = yield* AtomRegistry.getResult(registry, branchesAtom);
      const rows = branches as ReadonlyArray<Branch>;
      assert.isAbove(rows.length, 0);
      assert.isTrue(rows.some((row) => row.repoFullName === repo));
      assert.isTrue(rows.some((row) => row.name === "main" && row.isDefault));
      assert.isTrue(rows.some((row) => row.lastCommit.message.length > 0));
    }),
  );

  it.effect("lists the skills installed in a repository", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const skills = yield* AtomRegistry.getResult(registry, skillsAtom);
      const rows = skills as ReadonlyArray<Skill>;
      assert.isAbove(rows.length, 0);
      assert.isTrue(rows.every((row) => row.sourceRepo === repo));
      assert.isTrue(rows.every((row) => row.name.length > 0));
      assert.isTrue(rows.every((row) => row.description.length > 0));
    }),
  );

  it.effect("lists files and directories under a repository path", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const tree = yield* AtomRegistry.getResult(registry, treeAtom);
      const rows = tree as ReadonlyArray<TreeNode>;
      assert.isAbove(rows.length, 0);
      assert.isTrue(rows.some((row) => row.type === "directory"));
      assert.isTrue(rows.some((row) => row.type === "file" && row.size > 0));
      assert.isTrue(rows.every((row) => !row.path.includes("/")));
      assert.equal(projects.web.repos[0], repo);
    }),
  );
});
