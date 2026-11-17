import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { MockTransport } from "../mocks/MockServices.ts";
import { makeApiClientLayer } from "./ApiClient.ts";
import { Session } from "./Session.ts";

layer(Session.layer.pipe(Layer.provide(makeApiClientLayer(MockTransport))))(
  "Session",
  (it) => {
    it.effect("resolves the user and the first organization", () =>
      Effect.gen(function* () {
        const session = yield* Session;
        const user = yield* session.currentUser;
        const orgId = yield* session.activeOrgId;
        assert.strictEqual(user.lastName, "Morgan");
        assert.strictEqual(orgId, "org_sample_acme");
      }),
    );
  },
);
