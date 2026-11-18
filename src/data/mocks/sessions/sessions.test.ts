import { assert, describe, layer } from "@effect/vitest";
import { Effect } from "effect";
import { ApiClient, makeApiClientLayer } from "@/data/client/ApiClient.ts";
import { orgId, threads } from "../fixtures/world.ts";
import { MockTransport } from "../MockServices.ts";
import { seedSessions } from "./fixtures.ts";

describe("thread sessions mock", () => {
  layer(makeApiClientLayer(MockTransport))((it) => {
    it.effect("lists the measured thread's sessions", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const body = yield* client.threadSessions.list({
          params: { orgId, jamId: threads.captureProbe.id },
        });
        const rows = body as ReadonlyArray<{ kind: string }>;
        assert.deepEqual(rows.map((row) => row.kind).sort(), [
          "browser",
          "terminal",
        ]);
      }),
    );

    it.effect("answers an empty list for a thread with no session", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const body = yield* client.threadSessions.list({
          params: { orgId, jamId: threads.rateLimit.id },
        });
        assert.deepEqual(body, []);
      }),
    );

    it.effect("carries the ids the session tab keys are built from", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const body = yield* client.threadSessions.list({
          params: { orgId, jamId: threads.captureProbe.id },
        });
        const rows = body as ReadonlyArray<{
          kind: string;
          machineId?: string;
          clientId?: string;
        }>;
        const terminal = rows.find((row) => row.kind === "terminal");
        assert.isDefined(terminal?.machineId);
        assert.isDefined(terminal?.clientId);
        assert.equal(seedSessions.length, rows.length);
      }),
    );
  });
});
