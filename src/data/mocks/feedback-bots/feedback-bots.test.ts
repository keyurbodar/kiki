import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, projects } from "../fixtures/world.ts";

const key = `feedback-bots:${orgId}`;
const botsAtom = ApiClient.query("feedback-bots", "feedbackBots", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});

interface Bot {
  readonly id: string;
  readonly name: string;
  readonly owner: { readonly id: string };
}

describe("feedback-bots mock", () => {
  it.effect("lists the org's feedback bots", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const bots = (yield* Registry.getResult(
        registry,
        botsAtom,
      )) as ReadonlyArray<Bot>;
      assert.isAbove(bots.length, 0);
      assert.isTrue(bots.every((bot) => bot.owner.id.length > 0));

      const filtered = ApiClient.query("feedback-bots", "feedbackBots", {
        params: { orgId },
        query: { projectId: projects.docs.id },
      });
      const docsBots = (yield* Registry.getResult(
        registry,
        filtered,
      )) as ReadonlyArray<Bot>;
      assert.isAbove(docsBots.length, 0);
      assert.equal(docsBots[0]!.name, "Docs helper");
    }),
  );
});
