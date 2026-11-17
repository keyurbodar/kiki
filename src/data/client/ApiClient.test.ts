import { assert, describe, it, layer } from "@effect/vitest";
import { Context, Effect } from "effect";
import { groupIds, KikiApi } from "../api/Api.ts";
import { InferredMethod } from "../api/annotations.ts";
import { OrgId, ProjectId } from "../api/schemas/ids.ts";
import { MockTransport } from "../mocks/MockServices.ts";
import { ApiClient, makeApiClientLayer } from "./ApiClient.ts";

const orgId = OrgId.make("org_sample_acme");

describe("KikiApi", () => {
  it("registers exactly the groups in groupIds", () => {
    assert.deepStrictEqual(
      Object.keys(KikiApi.groups).toSorted(),
      [...groupIds].toSorted(),
    );
  });

  it("declares at least one endpoint for every group", () => {
    for (const [id, group] of Object.entries(KikiApi.groups)) {
      assert.notStrictEqual(
        Object.keys(group.endpoints).length,
        0,
        `group ${id} declares no endpoints`,
      );
    }
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
        assert.strictEqual(second.items.length, 4);
        assert.isNotNull(second.cursor);
        const third = yield* client.jams.list({
          params: { orgId },
          query: { limit: 4, cursor: second.cursor ?? undefined },
        });
        assert.strictEqual(third.items.length, 2);
        assert.isNull(third.cursor);
        assert.isFalse(
          [...first.items, ...second.items, ...third.items].some(
            (thread) => thread.archived,
          ),
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
  },
);
