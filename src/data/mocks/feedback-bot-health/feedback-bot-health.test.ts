import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

const key = `feedback-bot-health:${orgId}`;
const healthAtom = ApiClient.query("feedback-bot-health", "feedbackBotHealth", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});

describe("feedback-bot-health mock", () => {
  it.effect("lists bot health", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const rows = (yield* Registry.getResult(
        registry,
        healthAtom,
      )) as ReadonlyArray<{
        botId: string;
        status: string;
        successRate: number;
      }>;
      assert.isAbove(rows.length, 0);
      assert.isTrue(rows.every((row) => row.successRate > 0));
      assert.isTrue(rows.some((row) => row.status === "healthy"));

      const filtered = ApiClient.query(
        "feedback-bot-health",
        "feedbackBotHealth",
        { params: { orgId }, query: { botId: rows[0]!.botId } },
      );
      const one = (yield* Registry.getResult(
        registry,
        filtered,
      )) as ReadonlyArray<{ botId: string }>;
      assert.deepStrictEqual(
        one.map((row) => row.botId),
        [rows[0]!.botId],
      );
    }),
  );
});
