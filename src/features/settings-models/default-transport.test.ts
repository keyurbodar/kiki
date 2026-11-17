import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { ApiClient, makeApiClientLayer } from "@/data/client/ApiClient";
import { MockTransport } from "@/data/mocks/MockServices";
import {
  readDeviceAttempt,
  readDevicePoll,
} from "./add-connection-sheet/device-attempt.ts";
import { readDiscovery } from "./model-connect-sheet/helpers.ts";
import { decodeRouting } from "./model-routing/decode.ts";

const params = { orgId: "org_sample_acme" };

layer(makeApiClientLayer(MockTransport))("default transport", (it) => {
  it.effect("turns a discovery reply into the rows the sheet lists", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const raw = yield* client.models.discoverModels({
        params,
        payload: { ownerType: "org", provider: "openai", key: "sk-test" },
      });
      const discovery = readDiscovery(raw);
      assert.strictEqual(discovery.outcome, "listed");
      assert.isAbove(discovery.models.length, 0);
      assert.isString(discovery.models[0]?.providerModelId);
    }),
  );

  it.effect("decodes a routing reply into the lists the pages read", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const routing = decodeRouting(yield* client.models.routing({ params }));
      assert.isDefined(routing);
      if (routing === undefined) return;
      assert.isArray(routing.seats);
      assert.isArray(routing.credentials);
      assert.isArray(routing.routes);
      assert.isArray(routing.settings);
    }),
  );

  it.effect("reads a device login's verification link and poll status", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const attempt = readDeviceAttempt(
        yield* client.models.startDevice({
          params: { service: "anthropic" },
          query: {},
        }),
      );
      assert.isNotEmpty(attempt.attemptId);
      assert.isNotEmpty(attempt.verificationUri);
      assert.isAbove(attempt.intervalSeconds, 0);
      const poll = readDevicePoll(
        yield* client.models.pollDevice({
          params: { attemptId: attempt.attemptId },
        }),
      );
      assert.strictEqual(poll.status, "connected");
    }),
  );
});
