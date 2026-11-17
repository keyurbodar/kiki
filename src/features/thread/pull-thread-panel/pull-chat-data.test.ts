import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { JamId, OrgId } from "@/data/api/schemas/ids";
import { ApiClient } from "@/data/client/ApiClient";
import { orgId, projects, pulls } from "@/data/mocks/fixtures/world";

const pullId = pulls[0]?.id ?? "";
const createThread = ApiClient.mutation("jams", "create");
const linkThread = ApiClient.mutation("pulls", "linkThread");

describe("pull chat data", () => {
  it.effect("starts a thread with its opening message and links it", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(createThread, {
        params: { orgId, projectId: projects.web.id },
        payload: {
          title: "#128 Add dark mode to settings",
          message: "Summarize the open review comments",
          branches: { "acme/web": "feat/dark-mode" },
        },
      });
      const created = (yield* AtomRegistry.getResult(
        registry,
        createThread,
      )) as { id: string };

      const thread = (yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("jams", "get", {
          params: { orgId: OrgId.make(orgId), jamId: JamId.make(created.id) },
        }),
      )) as unknown as {
        userId?: string;
        preview?: string | null;
        createdAt?: unknown;
      };
      assert.equal(thread.preview, "Summarize the open review comments");
      assert.isString(thread.userId);
      assert.isDefined(thread.createdAt);

      registry.set(linkThread, {
        params: { orgId, pullId },
        payload: { jamId: created.id },
        reactivityKeys: [`pull:${pullId}`],
      });
      yield* AtomRegistry.getResult(registry, linkThread);
      const linked = (yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("pulls", "threads", {
          params: { orgId, pullId },
          reactivityKeys: [`pull:${pullId}`],
        }),
        { suspendOnWaiting: true },
      )) as ReadonlyArray<{ id: string }>;
      assert.include(
        linked.map((row) => row.id),
        created.id,
      );
    }),
  );
});
