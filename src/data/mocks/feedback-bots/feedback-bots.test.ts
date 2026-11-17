import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Bot {
  readonly login: string;
  readonly avatarUrl: string;
}

const key = `feedback-bots:${orgId}`;
const botsAtom = (search: string) =>
  ApiClient.query("feedback-bots", "feedbackBots", {
    params: { orgId },
    query: { search },
    reactivityKeys: [key],
  });

describe("feedback-bots mock", () => {
  it.effect("lists feedback bots and filters by search", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const bots = (yield* AtomRegistry.getResult(
        registry,
        botsAtom("sample"),
      )) as ReadonlyArray<Bot>;
      assert.isAbove(bots.length, 0);
      assert.isString(bots[0]!.login);
      assert.isString(bots[0]!.avatarUrl);

      const filtered = (yield* AtomRegistry.getResult(
        registry,
        botsAtom("capy-review"),
      )) as ReadonlyArray<Bot>;
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0]!.login, "capy-review-sample");
    }),
  );
});
