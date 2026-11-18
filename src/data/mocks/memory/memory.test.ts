import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";
import { memories } from "./fixtures.ts";

interface Memory {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly status: string;
}

const key = `memory:${orgId}`;

const listAtom = ApiClient.query("memory", "list", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const memoryId = memories[0]?.id ?? "mem_sample_checkout";
const readAtom = ApiClient.query("memory", "read", {
  params: { orgId, volumeId: memoryId },
  query: {},
  reactivityKeys: [key],
});
const edit = ApiClient.mutation("memory", "edit");
const forget = ApiClient.mutation("memory", "forget");
const restore = ApiClient.mutation("memory", "restore");

const entries = (result: unknown) => result as ReadonlyArray<Memory>;

describe("memory mock", () => {
  it.effect("serves every read endpoint with active memories", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const list = entries(yield* AtomRegistry.getResult(registry, listAtom));
      const read = (yield* AtomRegistry.getResult(
        registry,
        readAtom,
      )) as Memory;
      assert.isAbove(list.length, 0);
      assert.isTrue(list.every((row) => row.status === "active"));
      assert.equal(read.id, memories[0]?.id);
      assert.equal(read.status, "active");
    }),
  );

  it.effect("edits, forgets and restores a memory with shared reactivity", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(readAtom);
      yield* AtomRegistry.getResult(registry, listAtom);

      registry.set(edit, {
        params: { orgId, volumeId: memoryId },
        payload: { title: "Checkout retry policy", body: "Retry twice." },
        reactivityKeys: [key],
      });
      const edited = (yield* AtomRegistry.getResult(registry, edit)) as Memory;
      assert.equal(edited.title, "Checkout retry policy");
      const afterEdit = (yield* AtomRegistry.getResult(registry, readAtom, {
        suspendOnWaiting: true,
      })) as Memory;
      assert.equal(afterEdit.title, edited.title);

      registry.set(forget, {
        params: { orgId, volumeId: memoryId },
        payload: { reason: "Stale" },
        reactivityKeys: [key],
      });
      const forgotten = (yield* AtomRegistry.getResult(
        registry,
        forget,
      )) as Memory & { reason: string };
      assert.isTrue(forgotten.id.startsWith("mem"));
      assert.equal(forgotten.status, "forgotten");
      assert.equal(forgotten.reason, "Stale");
      assert.notInclude(
        entries(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).map((row) => row.id),
        memoryId,
      );

      registry.set(restore, {
        params: { orgId, volumeId: memoryId },
        payload: {},
        reactivityKeys: [key],
      });
      const restored = (yield* AtomRegistry.getResult(
        registry,
        restore,
      )) as Memory;
      assert.equal(restored.status, "active");
      assert.include(
        entries(
          yield* AtomRegistry.getResult(registry, listAtom, {
            suspendOnWaiting: true,
          }),
        ).map((row) => row.id),
        memoryId,
      );
    }),
  );

  it.effect(
    "answers the 404 every entry endpoint declares for an unknown id",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const params = { orgId, volumeId: "mem_nobody" };
        const missingRead = ApiClient.query("memory", "read", {
          params,
          query: {},
          reactivityKeys: [key],
        });
        const readError = yield* AtomRegistry.getResult(
          registry,
          missingRead,
        ).pipe(Effect.flip);
        assert.instanceOf(readError, HttpApiError.NotFound);

        for (const atom of [edit, forget, restore]) {
          registry.set(atom as never, { params, payload: {} });
          const error = yield* AtomRegistry.getResult(
            registry,
            atom as never,
          ).pipe(Effect.flip);
          assert.instanceOf(error, HttpApiError.NotFound);
        }
      }),
  );
});
