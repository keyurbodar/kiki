import { assert, describe, it, layer } from "@effect/vitest";
import { Context, Effect } from "effect";
import { KikiApi } from "../api/Api.ts";
import { InferredMethod } from "../api/annotations.ts";
import { OrgId, ProjectId } from "../api/schemas/ids.ts";
import { MockTransport } from "../mocks/MockServices.ts";
import { notImplementedStatus } from "../mocks/mockGroup.ts";
import { ApiClient, makeApiClientLayer } from "./ApiClient.ts";

const orgId = OrgId.make("org_sample_acme");

describe("KikiApi", () => {
  it("declares all 60 groups and 703 endpoints", () => {
    const groups = Object.values(KikiApi.groups);
    const endpoints = groups.flatMap((group) => Object.keys(group.endpoints));
    assert.strictEqual(groups.length, 60);
    assert.strictEqual(endpoints.length, 703);
  });

  it("marks the methods api.md had to infer", () => {
    const inferred = Object.values(KikiApi.groups)
      .flatMap((group) => Object.values(group.endpoints))
      .filter((endpoint) => Context.get(endpoint.annotations, InferredMethod));
    assert.strictEqual(inferred.length, 198);
  });
});

layer(makeApiClientLayer(MockTransport))(
  "ApiClient over MockServices",
  (it) => {
    it.effect("returns the session user", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const user = yield* client.users.getCurrent();
        assert.strictEqual(user.firstName, "Alex");
      }),
    );

    it.effect("lists organizations and fails on an unknown one", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const organizations = yield* client.organizations.list();
        assert.deepStrictEqual(
          organizations.map((organization) => organization.name),
          ["Acme", "Northwind Labs"],
        );
        const error = yield* client.organizations
          .get({ params: { orgId: OrgId.make("org_missing") } })
          .pipe(Effect.flip);
        assert.strictEqual(error._tag, "capy/Forbidden");
      }),
    );

    it.effect("lists live projects unless deleted ones are asked for", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const live = yield* client.projects.list({
          params: { orgId },
          query: {},
        });
        const deleted = yield* client.projects.list({
          params: { orgId },
          query: { deleted: "true" },
        });
        assert.deepStrictEqual(
          live.map((project) => project.code),
          ["WEB", "API", "DOC"],
        );
        assert.deepStrictEqual(
          deleted.map((project) => project.code),
          ["OLD"],
        );
      }),
    );

    it.effect("pages through threads with a cursor", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const first = yield* client.jams.list({
          params: { orgId },
          query: { limit: 4 },
        });
        assert.strictEqual(first.items.length, 4);
        assert.isNotNull(first.cursor);
        const second = yield* client.jams.list({
          params: { orgId },
          query: { limit: 4, cursor: first.cursor ?? undefined },
        });
        assert.strictEqual(second.items.length, 2);
        assert.isNull(second.cursor);
        assert.isFalse(
          [...first.items, ...second.items].some((thread) => thread.archived),
        );
      }),
    );

    it.effect("filters threads by project, search and archive state", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const api = yield* client.jams.list({
          params: { orgId },
          query: { projectIds: [ProjectId.make("proj_sample_api")] },
        });
        assert.deepStrictEqual(
          api.items.map((thread) => thread.threadNumber),
          [39, 38],
        );
        const searched = yield* client.jams.list({
          params: { orgId },
          query: { search: "DARK MODE" },
        });
        assert.deepStrictEqual(
          searched.items.map((thread) => thread.threadNumber),
          [40],
        );
        const archived = yield* client.jams.list({
          params: { orgId },
          query: { archived: "only" },
        });
        assert.deepStrictEqual(
          archived.items.map((thread) => thread.status),
          ["archived"],
        );
      }),
    );

    it.effect("answers unfilled endpoints with 501 Not Implemented", () =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const error = yield* client.automations
          .list({ params: { orgId }, query: {} })
          .pipe(Effect.flip);
        assert.strictEqual(error._tag, "HttpClientError");
        assert.include(String(error), `(${notImplementedStatus} GET`);
      }),
    );
  },
);
