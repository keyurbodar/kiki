import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AsyncResult, type Atom, AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { driveFiles, orgId, people } from "../fixtures/world.ts";

const key = `volumes:${orgId}`;
const volumeId = "vol_sample_acme";
const versionId = "ver_sample_2";
const listAtom = ApiClient.query("volumes", "list", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const sharesAtom = ApiClient.query("volumes", "listShares", {
  params: { orgId, volumeId },
  reactivityKeys: [key],
});
const write = ApiClient.mutation("volumes", "write");
const createShare = ApiClient.mutation("volumes", "createShare");
const revokeShare = ApiClient.mutation("volumes", "revokeShare");

interface Listing {
  readonly items: ReadonlyArray<{ readonly id: string; readonly path: string }>;
}

type Share = { readonly id: string };

const paths = (value: unknown) =>
  (value as Listing).items.map((row) => row.path);
const shareIds = (value: unknown) =>
  (value as ReadonlyArray<Share>).map((row) => row.id);

describe("volumes mock", () => {
  it.effect("answers every volumes endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      assert.isAbove(
        paths(yield* AtomRegistry.getResult(registry, listAtom)).length,
        0,
      );

      const get = <A, E>(atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>) =>
        AtomRegistry.getResult(registry, atom);
      const queries = [
        ApiClient.query("volumes", "readShare", {
          params: { shareId: "shr_sample_spec" },
        }),
        ApiClient.query("volumes", "agentContextPreview", {
          params: { orgId },
          query: {},
        }),
        ApiClient.query("volumes", "scopeDirectory", {
          params: { orgId },
          query: {},
        }),
        ApiClient.query("volumes", "listOrgShares", {
          params: { orgId },
          query: {},
        }),
        ApiClient.query("volumes", "skills", {
          params: { orgId },
          query: {},
        }),
        ApiClient.query("volumes", "fileVersions", {
          params: { orgId, volumeId },
          query: { fileId: driveFiles[0].id },
        }),
        ApiClient.query("volumes", "listShares", {
          params: { orgId, volumeId },
        }),
        ApiClient.query("volumes", "versions", { params: { orgId, volumeId } }),
        ApiClient.query("volumes", "manifest", {
          params: { orgId, volumeId, versionId },
          query: {},
        }),
        ApiClient.query("volumes", "changes", {
          params: { orgId, volumeId, versionId },
        }),
        ApiClient.query("volumes", "file", {
          params: { orgId, volumeId, versionId, sha256: "sha256_sample_spec" },
        }),
        ApiClient.query("volumes", "tree", {
          params: { orgId, volumeId, versionId },
          query: {},
        }),
        ApiClient.query("volumes", "publicShare", {
          params: { shareId: "shr_sample_chart" },
        }),
      ];
      for (const query of queries) {
        assert.isNotEmpty(yield* get(query));
      }

      const archive = ApiClient.mutation("volumes", "archive");
      registry.set(archive, {
        params: { orgId, volumeId },
        reactivityKeys: [key],
      });
      assert.isNotEmpty(yield* AtomRegistry.getResult(registry, archive));

      const restore = ApiClient.mutation("volumes", "restore");
      registry.set(restore, {
        params: { orgId, volumeId },
        payload: { versionId },
        reactivityKeys: [key],
      });
      assert.isNotEmpty(yield* AtomRegistry.getResult(registry, restore));

      const unarchive = ApiClient.mutation("volumes", "unarchive");
      registry.set(unarchive, {
        params: { orgId, volumeId },
        reactivityKeys: [key],
      });
      assert.isNotEmpty(yield* AtomRegistry.getResult(registry, unarchive));

      const purgeName = ApiClient.mutation("volumes", "purgeName");
      registry.set(purgeName, {
        params: { orgId, volumeId },
        payload: { name: "notes/old-plan.md" },
        reactivityKeys: [key],
      });
      const purged = yield* AtomRegistry.getResult(registry, purgeName);
      assert.isTrue((purged as { ok: boolean }).ok);

      const updateShare = ApiClient.mutation("volumes", "updateShare");
      registry.set(updateShare, {
        params: { orgId, shareId: "shr_sample_spec" },
        payload: { permission: "edit" },
        reactivityKeys: [key],
      });
      assert.isNotEmpty(yield* AtomRegistry.getResult(registry, updateShare));
    }),
  );

  it.effect("refreshes drive files and shares after mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(sharesAtom);
      yield* AtomRegistry.getResult(registry, listAtom);
      const before = paths(yield* AtomRegistry.getResult(registry, listAtom));

      registry.set(write, {
        params: { orgId },
        payload: {
          path: "notes/wiring-test.md",
          size: 12,
          mimeType: "text/markdown",
          updatedBy: people.alex.id,
        },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, write);
      const after = paths(
        yield* AtomRegistry.getResult(registry, listAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isAbove(after.length, before.length);
      assert.include(after, "notes/wiring-test.md");

      registry.set(createShare, {
        params: { orgId, volumeId },
        payload: {
          fileId: driveFiles[0].id,
          scope: "organization",
          permission: "view",
        },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, createShare);
      const id = (created as { id: string }).id;
      const withShare = yield* AtomRegistry.getResult(registry, sharesAtom, {
        suspendOnWaiting: true,
      });
      assert.include(shareIds(withShare), id);

      registry.set(revokeShare, {
        params: { orgId, shareId: id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, revokeShare);
      const afterRevoke = yield* AtomRegistry.getResult(registry, sharesAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(shareIds(afterRevoke), id);
    }),
  );
});
