import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { Forbidden } from "../../api/schemas/errors.ts";
import { OrgId } from "../../api/schemas/ids.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { org } from "../fixtures/world.ts";

const key = `orgs:${org.id}`;
const params = { orgId: OrgId.make(org.id) };
const organizationAtom = ApiClient.query("organizations", "get", {
  params,
  reactivityKeys: [key],
});
const update = ApiClient.mutation("orgs", "update");
const remove = ApiClient.mutation("orgs", "delete");

describe("orgs mock", () => {
  it.effect("updates and deletes the organization", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(organizationAtom);
      yield* AtomRegistry.getResult(registry, organizationAtom, {
        suspendOnWaiting: true,
      });

      registry.set(update, {
        params,
        payload: { name: "Acme Engineering", issuePrefix: "ENG" },
        reactivityKeys: [key],
      });
      const updated = (yield* AtomRegistry.getResult(registry, update)) as {
        name: string;
        issuePrefix: string;
        memberCount: number;
      };
      assert.equal(updated.name, "Acme Engineering");
      assert.equal(updated.issuePrefix, "ENG");
      assert.isAbove(updated.memberCount, 0);
      const afterUpdate = yield* AtomRegistry.getResult(
        registry,
        organizationAtom,
        { suspendOnWaiting: true },
      );
      assert.equal(afterUpdate.name, "Acme Engineering");

      registry.set(remove, { params, reactivityKeys: [key] });
      const deleted = (yield* AtomRegistry.getResult(registry, remove)) as {
        ok: boolean;
        deletedAt: string;
      };
      assert.isTrue(deleted.ok);
      assert.isString(deleted.deletedAt);
    }),
  );

  it.effect("answers the 403 the routes declare for a foreign org id", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const foreign = { orgId: OrgId.make("org_nobody") };
      for (const atom of [update, remove]) {
        registry.set(atom as never, {
          params: foreign,
          payload: { name: "Nope" },
          reactivityKeys: [key],
        });
        const error = yield* AtomRegistry.getResult(
          registry,
          atom as never,
        ).pipe(Effect.flip);
        assert.instanceOf(error, Forbidden);
      }
    }),
  );
});
