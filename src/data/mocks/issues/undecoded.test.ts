import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AsyncResult, type Atom, AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

const read = <A, E>(
  registry: AtomRegistry.AtomRegistry,
  atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
) => AtomRegistry.getResult(registry, atom);

describe("issues mock: undecoded endpoints", () => {
  it.effect("prefix, counts, files and captain activity answer", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const prefix = yield* read(
        registry,
        ApiClient.query("issues", "prefix", { params: { orgId } }),
      );
      assert.equal((prefix as { prefix: string }).prefix, "ACME");
      const counts = yield* read(
        registry,
        ApiClient.query("issues", "stateCounts", { params: { orgId } }),
      );
      assert.isAbove(Object.keys(counts as object).length, 0);
      const fileUrl = yield* read(
        registry,
        ApiClient.query("issues", "fileUrl", {
          params: { orgId, code: "ACME-1", fileId: "file_sample_spec" },
          query: {},
        }),
      );
      assert.include((fileUrl as { url: string }).url, "files.example.com");
      const assigned = yield* read(
        registry,
        ApiClient.query("issues", "assignedCount", {
          params: { orgId },
          query: {},
        }),
      );
      assert.isAbove(assigned as number, 0);
      const activity = yield* read(
        registry,
        ApiClient.query("issues", "captainActivity", {
          params: { orgId, jamId: "jam_sample_cap1" },
        }),
      );
      assert.isAbove(
        (activity as { items: ReadonlyArray<unknown> }).items.length,
        0,
      );
    }),
  );

  it.effect("state mutations change the shared list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const createState = ApiClient.mutation("issues", "createState");
      registry.set(createState, {
        params: { orgId },
        payload: { name: "Blocked", category: "started", color: "warning" },
      });
      const state = (yield* AtomRegistry.getResult(registry, createState)) as {
        id: string;
      };
      const reorder = ApiClient.mutation("issues", "reorderStates");
      registry.set(reorder, {
        params: { orgId },
        payload: { stateIds: [state.id] },
      });
      const ordered = (yield* AtomRegistry.getResult(
        registry,
        reorder,
      )) as ReadonlyArray<{ id: string }>;
      assert.equal(ordered[0]?.id, state.id);
    }),
  );
});
