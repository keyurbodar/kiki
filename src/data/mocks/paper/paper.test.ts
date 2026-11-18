import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads, world } from "../fixtures/world.ts";

const params = { orgId, jamId: threads.checkoutTest.id };
const key = `paper:${threads.checkoutTest.id}`;

const filesAtom = ApiClient.query("paper", "listPaperFiles", {
  params,
  reactivityKeys: [key],
});
const mintEmbed = ApiClient.mutation("paper", "mintPaperEmbed");

interface Row {
  readonly id: string;
  readonly threadId?: string;
  readonly fileId?: string;
}

const rows = (value: unknown) => value as ReadonlyArray<Row>;
const row = (value: unknown) => value as Row;

describe("paper mock", () => {
  it.effect("lists files from the shared drive fixtures", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const files = yield* AtomRegistry.getResult(registry, filesAtom);
      assert.isDefined(files);
      assert.deepStrictEqual(
        rows(files).map((file) => file.id),
        [world.driveFiles[0].id, world.driveFiles[2].id],
      );
    }),
  );

  it.effect("mints an embed for the thread", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(filesAtom);
      yield* AtomRegistry.getResult(registry, filesAtom);

      registry.set(mintEmbed, {
        params,
        payload: { fileId: world.driveFiles[2].id },
        reactivityKeys: [key],
      });
      const created = yield* AtomRegistry.getResult(registry, mintEmbed);
      assert.strictEqual(row(created).threadId, params.jamId);
      assert.strictEqual(row(created).fileId, world.driveFiles[2].id);
      const files = yield* AtomRegistry.getResult(registry, filesAtom, {
        suspendOnWaiting: true,
      });
      assert.isTrue(rows(files).length > 0);
    }),
  );

  it.effect(
    "answers the 404 both endpoints declare for an unknown thread",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const missingParams = { orgId, jamId: "jam_nobody" };
        const missingFiles = ApiClient.query("paper", "listPaperFiles", {
          params: missingParams,
          reactivityKeys: [key],
        });
        const filesError = yield* AtomRegistry.getResult(
          registry,
          missingFiles,
        ).pipe(Effect.flip);
        assert.instanceOf(filesError, HttpApiError.NotFound);

        registry.set(mintEmbed, {
          params: missingParams,
          payload: { fileId: world.driveFiles[2].id },
        });
        const mintError = yield* AtomRegistry.getResult(
          registry,
          mintEmbed,
        ).pipe(Effect.flip);
        assert.instanceOf(mintError, HttpApiError.NotFound);
      }),
  );
});
