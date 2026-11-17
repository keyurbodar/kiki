import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads, world } from "../fixtures/world.ts";

const key = `threadCollection:${orgId}`;
const folderId = world.threadFolders[0].id;

const folderAtom = ApiClient.query("threadCollection", "folderThreads", {
  params: { orgId, folderId },
  query: {},
  reactivityKeys: [key],
});
const readMutation = ApiClient.mutation("threadCollection", "read");

describe("threadCollection mock", () => {
  it.effect("returns folder threads and resolves a thread by code", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const page = yield* AtomRegistry.getResult(registry, folderAtom);
      assert.isAtLeast(
        (page as { items: ReadonlyArray<unknown> }).items.length,
        1,
      );

      registry.set(readMutation, {
        params: { orgId },
        payload: { code: `ACME-${threads.checkoutTest.number}` },
        reactivityKeys: [key],
      });
      const read = yield* AtomRegistry.getResult(registry, readMutation);
      assert.strictEqual((read as { ok: boolean }).ok, true);

      const byCode = ApiClient.mutation("threadCollection", "byCode");
      registry.set(byCode, {
        params: { orgId },
        payload: { code: `ACME-${threads.checkoutTest.number}` },
        reactivityKeys: [key],
      });
      const thread = yield* AtomRegistry.getResult(registry, byCode);
      assert.strictEqual(
        (thread as { id: string }).id,
        threads.checkoutTest.id,
      );
    }),
  );
});
