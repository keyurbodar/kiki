import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { type AtomRegistry, AtomRegistry as Registry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, repos } from "../fixtures/world.ts";

const key = `telemetry:${orgId}`;
const issuesAtom = ApiClient.query("telemetry", "listIssues", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});

interface BrowserIssue {
  readonly id: string;
  readonly repo: string;
  readonly ignored: boolean;
  readonly resolved: boolean;
}

const issues = (value: unknown) => value as ReadonlyArray<BrowserIssue>;
const run = (
  registry: AtomRegistry.AtomRegistry,
  atom: unknown,
  input: object,
) => {
  const writable = atom as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return Registry.getResult(registry, writable as never) as Effect.Effect<
    unknown,
    never,
    never
  >;
};

describe("telemetry mock", () => {
  it.effect("lists browser issues and applies each status mutation", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      registry.mount(issuesAtom);
      const rows = issues(yield* Registry.getResult(registry, issuesAtom));
      assert.isAbove(rows.length, 0);
      assert.include(
        rows.map((row) => row.repo),
        repos[0].fullName,
      );
      const id = rows[0]!.id;

      yield* run(registry, ApiClient.mutation("telemetry", "ignoreIssue"), {
        params: { orgId, issueId: id },
      });
      let current = issues(
        yield* Registry.getResult(registry, issuesAtom, {
          suspendOnWaiting: true,
        }),
      ).find((row) => row.id === id);
      assert.isTrue(current?.ignored);

      yield* run(registry, ApiClient.mutation("telemetry", "unignoreIssue"), {
        params: { orgId, issueId: id },
      });
      yield* run(registry, ApiClient.mutation("telemetry", "resolveIssue"), {
        params: { orgId, issueId: id },
      });
      current = issues(
        yield* Registry.getResult(registry, issuesAtom, {
          suspendOnWaiting: true,
        }),
      ).find((row) => row.id === id);
      assert.isTrue(current?.resolved);

      yield* run(registry, ApiClient.mutation("telemetry", "unresolveIssue"), {
        params: { orgId, issueId: id },
      });
      current = issues(
        yield* Registry.getResult(registry, issuesAtom, {
          suspendOnWaiting: true,
        }),
      ).find((row) => row.id === id);
      assert.isFalse(current?.resolved);
    }),
  );

  it.effect("accepts error and span batches", () =>
    Effect.gen(function* () {
      const registry = Registry.make();
      const ingestedErrors = (yield* run(
        registry,
        ApiClient.mutation("telemetry", "ingestErrors"),
        {
          params: { orgId },
          payload: {
            errors: [{ message: "Retry failed", service: "acme-web" }],
          },
        },
      )) as { ingested: number; errors: ReadonlyArray<{ id: string }> };
      assert.equal(ingestedErrors.ingested, 1);
      assert.equal(ingestedErrors.errors.length, 1);

      const ingestedSpans = (yield* run(
        registry,
        ApiClient.mutation("telemetry", "ingestSpans"),
        {
          params: { orgId },
          payload: {
            spans: [{ name: "GET /checkout", durationMs: 42, status: "ok" }],
          },
        },
      )) as { ingested: number; spans: ReadonlyArray<{ id: string }> };
      assert.equal(ingestedSpans.ingested, 1);
      assert.equal(ingestedSpans.spans.length, 1);
    }),
  );
});
