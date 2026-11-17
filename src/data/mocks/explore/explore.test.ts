import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { ExploreListing } from "../../api/schemas/explore.ts";
import { ApiClient, makeApiClientLayer } from "../../client/ApiClient.ts";
import { MockTransport } from "../MockServices.ts";

const orgId = "org_sample_acme";

layer(makeApiClientLayer(MockTransport))("explore mocks", (it) => {
  it.effect("serves a listing and fails unknown slugs", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const listing = yield* client.explorePublic.listing({
        params: { kind: "plugin", slug: "edge-platform" },
      });
      assert.instanceOf(listing, ExploreListing);
      assert.strictEqual(listing.content.kind, "plugin");
      const missing = yield* client.explorePublic
        .listing({ params: { kind: "skill", slug: "nope" } })
        .pipe(Effect.flip);
      assert.strictEqual(missing._tag, "capy/ExploreNotFound");
    }),
  );

  it.effect("filters the index by kind and search", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const all = yield* client.explore.listings({
        params: { orgId },
        query: {},
      });
      assert.isAbove(all.cards.length, 0);

      const skills = yield* client.explore.listings({
        params: { orgId },
        query: { kind: "skill" },
      });
      assert.isAbove(skills.cards.length, 0);
      assert.isTrue(skills.cards.every((card) => card.kind === "skill"));

      const searched = yield* client.explore.listings({
        params: { orgId },
        query: { q: "playbook" },
      });
      assert.isAbove(searched.cards.length, 0);
      assert.isBelow(searched.cards.length, all.cards.length + 1);
      assert.isTrue(
        searched.cards.every((card) => card.slug === "debugging-playbook"),
      );
    }),
  );

  it.effect("toggles theme visibility", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const slug = "debugging-playbook";
      const before = yield* client.explore.themeVisibility({
        params: { slug },
      });
      assert.strictEqual(before.hidden, false);
      const hidden = yield* client.explore.setThemeVisibility({
        params: { slug },
        payload: { hidden: true },
      });
      assert.strictEqual(hidden.hidden, true);
      const after = yield* client.explore.themeVisibility({ params: { slug } });
      assert.strictEqual(after.hidden, true);
      const shown = yield* client.explore.setThemeVisibility({
        params: { slug },
        payload: { hidden: false },
      });
      assert.strictEqual(shown.hidden, false);
    }),
  );

  it.effect("adds a skill and reports it as added", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const first = yield* client.explore.addSkill({
        params: { orgId },
        payload: {
          slug: "debugging-playbook",
          scope: { projectId: "prj_sample_web" },
        },
      });
      assert.strictEqual(first.replaced, false);
      const index = yield* client.explore.listings({
        params: { orgId },
        query: {},
      });
      assert.include(index.added, "skill:debugging-playbook");
      const again = yield* client.explore.addSkill({
        params: { orgId },
        payload: { slug: "debugging-playbook", scope: {} },
      });
      assert.strictEqual(again.replaced, true);
      yield* client.explore.report({
        params: { orgId },
        payload: {
          kind: "skill",
          slug: "debugging-playbook",
          reason: "broken",
        },
      });
    }),
  );
});
