import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { OrgId } from "../api/schemas/ids.ts";
import { pullGuideAtom } from "./pullGuides.ts";

const orgId = OrgId.make("org_sample_acme");

describe("pull guide atom over MockServices", () => {
  it.effect("reads the chapters of a completed guide", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const guide = (yield* AtomRegistry.getResult(
        registry,
        pullGuideAtom(orgId, "pr_sample_128"),
      )) as {
        state: string;
        groups: ReadonlyArray<{ title: string; files: ReadonlyArray<string> }>;
      };
      assert.strictEqual(guide.state, "completed");
      assert.deepStrictEqual(
        guide.groups.map((group) => group.title),
        ["The surface", "The logic", "The tests"],
      );
      assert.deepStrictEqual(guide.groups[1]?.files, ["src/checkout/retry.ts"]);
    }),
  );

  it.effect("reports a pull whose guide is still generating", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const guide = (yield* AtomRegistry.getResult(
        registry,
        pullGuideAtom(orgId, "pr_sample_131"),
      )) as { state: string };
      assert.strictEqual(guide.state, "generating");
    }),
  );
});
