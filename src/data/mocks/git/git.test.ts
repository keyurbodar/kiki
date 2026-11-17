import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads, world } from "../fixtures/world.ts";

interface GitFile {
  readonly path: string;
  readonly content: string;
  readonly language: string;
  readonly size: number;
  readonly updatedAt: string;
}

interface GitEntry {
  readonly name: string;
  readonly path: string;
  readonly type: "file" | "directory";
  readonly children?: ReadonlyArray<GitEntry>;
}

const key = `git:${threads.checkoutTest.id}`;
const params = { orgId, jamId: threads.checkoutTest.id };
const filePath = "src/checkout/retry.ts";

const blobAtom = ApiClient.query("git", "blob", {
  params,
  query: { path: filePath },
  reactivityKeys: [key],
});
const manifestAtom = ApiClient.query("git", "manifest", {
  params,
  query: {},
  reactivityKeys: [key],
});
const patchAtom = ApiClient.query("git", "patch", {
  params,
  query: {},
  reactivityKeys: [key],
});
const statusAtom = ApiClient.query("git", "status", {
  params,
  reactivityKeys: [key],
});
const storedFileAtom = ApiClient.query("git", "storedFile", {
  params,
  query: { path: filePath },
  reactivityKeys: [key],
});
const storedTreeAtom = ApiClient.query("git", "storedTree", {
  params,
  query: {},
  reactivityKeys: [key],
});
const treeAtom = ApiClient.query("git", "tree", {
  params,
  query: {},
  reactivityKeys: [key],
});
const turnsAtom = ApiClient.query("git", "turns", {
  params,
  reactivityKeys: [key],
});
const writeFile = ApiClient.mutation("git", "write");

const nonEmpty = (value: unknown) =>
  assert.isTrue(
    Array.isArray(value)
      ? value.length > 0
      : Object.keys(value as object).length > 0,
  );

describe("git mock", () => {
  it.effect("reads every thread file endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();

      const blob = yield* AtomRegistry.getResult(registry, blobAtom);
      nonEmpty(blob);
      assert.equal((blob as GitFile).path, filePath);
      assert.isString((blob as GitFile).content);
      assert.isNumber((blob as GitFile).size);

      const manifest = yield* AtomRegistry.getResult(registry, manifestAtom);
      nonEmpty(manifest);
      assert.equal(
        (manifest as { repo: string }).repo,
        world.repos[0].fullName,
      );
      assert.isAbove(
        (manifest as { files: ReadonlyArray<unknown> }).files.length,
        0,
      );

      const patch = yield* AtomRegistry.getResult(registry, patchAtom);
      nonEmpty(patch);
      assert.include((patch as { patch: string }).patch, "+++ b/");
      assert.isAbove(
        (patch as { files: ReadonlyArray<unknown> }).files.length,
        0,
      );

      const status = yield* AtomRegistry.getResult(registry, statusAtom);
      nonEmpty(status);
      assert.equal((status as { branch: string }).branch, world.branches[1]);
      assert.isNumber((status as { ahead: number }).ahead);
      assert.isArray(
        (status as { untracked: ReadonlyArray<string> }).untracked,
      );

      const storedFile = yield* AtomRegistry.getResult(
        registry,
        storedFileAtom,
      );
      nonEmpty(storedFile);
      assert.equal((storedFile as GitFile).path, filePath);

      const storedTree = yield* AtomRegistry.getResult(
        registry,
        storedTreeAtom,
      );
      nonEmpty(storedTree);
      assert.isAbove(
        (storedTree as { entries: ReadonlyArray<GitEntry> }).entries.length,
        0,
      );

      const tree = yield* AtomRegistry.getResult(registry, treeAtom);
      nonEmpty(tree);
      assert.isAbove(
        (tree as { entries: ReadonlyArray<GitEntry> }).entries.length,
        0,
      );

      const turns = yield* AtomRegistry.getResult(registry, turnsAtom);
      assert.isAbove((turns as ReadonlyArray<unknown>).length, 0);
      assert.equal(
        (turns as ReadonlyArray<{ threadId: string }>)[0]?.threadId,
        threads.checkoutTest.id,
      );
    }),
  );

  it.effect("refetches the blob and manifest after a write", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(blobAtom);
      registry.mount(manifestAtom);
      const before = yield* AtomRegistry.getResult(registry, blobAtom);
      const content = `${(before as GitFile).content}\nexport const retried = true;\n`;

      registry.set(writeFile, {
        params,
        payload: { path: filePath, content },
        reactivityKeys: [key],
      });
      const written = yield* AtomRegistry.getResult(registry, writeFile);
      assert.equal((written as GitFile).path, filePath);

      const afterBlob = yield* AtomRegistry.getResult(registry, blobAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((afterBlob as GitFile).content, content);
      const afterManifest = yield* AtomRegistry.getResult(
        registry,
        manifestAtom,
        {
          suspendOnWaiting: true,
        },
      );
      const entry = (
        afterManifest as {
          files: ReadonlyArray<{ path: string; size: number }>;
        }
      ).files.find((row) => row.path === filePath);
      assert.equal(entry?.size, (written as GitFile).size);
    }),
  );
});
