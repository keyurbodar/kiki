import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";

describe("explorePublic theme listing", () => {
  it.effect("serves a theme listing that renders its detail page", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const listing = (yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("explorePublic", "listing", {
          params: { kind: "theme", slug: "classic-1pdtkp" },
        }),
      )) as {
        card: { kind: string; displayName: string };
        content: { kind: string; theme?: { light?: unknown; dark?: unknown } };
        versions: ReadonlyArray<{ version: string }>;
      };
      assert.strictEqual(listing.card.kind, "theme");
      assert.strictEqual(listing.card.displayName, "Classic");
      assert.strictEqual(listing.content.kind, "theme");
      assert.isDefined(listing.content.theme?.light);
      assert.isDefined(listing.content.theme?.dark);
      assert.isAbove(listing.versions.length, 0);
    }),
  );
});
