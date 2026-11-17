import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Listing {
  readonly kind: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly tags: ReadonlyArray<string>;
  readonly versions: ReadonlyArray<{ readonly version: string }>;
}

interface Skill {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly version: string;
}

interface Receipt {
  readonly ok: boolean;
  readonly id: string;
}

const key = `explore:${orgId}`;

const listingsAtom = ApiClient.query("explore", "listings", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const report = ApiClient.mutation("explore", "report");
const addSkill = ApiClient.mutation("explore", "addSkill");

const rows = (value: unknown) => value as ReadonlyArray<Listing>;

describe("explore mock", () => {
  it.effect("lists community listings with versions and authors", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const listings = rows(
        yield* AtomRegistry.getResult(registry, listingsAtom),
      );
      assert.isAbove(listings.length, 0);
      for (const listing of listings) {
        assert.isString(listing.kind);
        assert.isString(listing.slug);
        assert.isString(listing.displayName);
        assert.isString(listing.description);
        assert.isString(listing.authorId);
        assert.isString(listing.authorName);
        assert.isAbove(listing.versions.length, 0);
        assert.isAbove(listing.tags.length, 0);
      }
      assert.isTrue(
        listings.some((listing) => listing.authorName === "Alex Morgan"),
      );
    }),
  );

  it.effect("reports a listing and installs a skill", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listingsAtom);
      yield* AtomRegistry.getResult(registry, listingsAtom);

      registry.set(report, {
        params: { orgId },
        payload: { slug: "release-notes", reason: "Needs review" },
        reactivityKeys: [key],
      });
      const receipt = (yield* AtomRegistry.getResult(
        registry,
        report,
      )) as Receipt;
      assert.isTrue(receipt.ok);
      assert.isString(receipt.id);
      const afterReport = rows(
        yield* AtomRegistry.getResult(registry, listingsAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isAbove(afterReport.length, 0);

      registry.set(addSkill, {
        params: { orgId },
        payload: { slug: "docs-review", version: "2.0.0" },
        reactivityKeys: [key],
      });
      const skill = (yield* AtomRegistry.getResult(
        registry,
        addSkill,
      )) as Skill;
      assert.equal(skill.slug, "docs-review");
      assert.equal(skill.displayName, "Docs Review");
      assert.equal(skill.version, "2.0.0");
      const afterAdd = rows(
        yield* AtomRegistry.getResult(registry, listingsAtom, {
          suspendOnWaiting: true,
        }),
      );
      assert.isTrue(afterAdd.some((listing) => listing.slug === skill.slug));
    }),
  );
});
