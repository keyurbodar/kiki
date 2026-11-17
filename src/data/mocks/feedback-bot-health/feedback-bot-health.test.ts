import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface BotHealth {
  readonly login: string;
  readonly status: string;
  readonly lastSeenAt: string;
  readonly suggestion: string | null;
}

const key = `feedback-bot-health:${orgId}`;
const healthAtom = (logins: ReadonlyArray<string>) =>
  ApiClient.query("feedback-bot-health", "feedbackBotHealth", {
    params: { orgId },
    query: { logins },
    reactivityKeys: [key],
  });

describe("feedback-bot-health mock", () => {
  it.effect("reports bot health and filters by login", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const rows = (yield* AtomRegistry.getResult(
        registry,
        healthAtom([]),
      )) as ReadonlyArray<BotHealth>;
      assert.isAbove(rows.length, 0);
      assert.isString(rows[0]!.status);
      assert.isString(rows[0]!.lastSeenAt);

      const filtered = (yield* AtomRegistry.getResult(
        registry,
        healthAtom(["capy-notes-sample"]),
      )) as ReadonlyArray<BotHealth>;
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0]!.status, "stale");
      assert.isString(filtered[0]!.suggestion);
    }),
  );
});
