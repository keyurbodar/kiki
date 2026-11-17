import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people } from "../fixtures/world.ts";

interface Member {
  readonly id: string;
  readonly role: string;
  readonly removedAt: string | null;
  readonly mfaExtension: string | null;
}

const key = `members:${orgId}`;
const listAtom = ApiClient.query("members", "listMembers", {
  params: { orgId },
  query: {},
  reactivityKeys: [key],
});
const run = <A, I extends object>(
  atom: import("effect/reactivity/Atom").AtomResultFn<I, A>,
  input: I,
) => {
  const registry = AtomRegistry.make();
  registry.mount(listAtom);
  registry.set(atom, { ...input, reactivityKeys: [key] });
  return Effect.gen(function* () {
    yield* AtomRegistry.getResult(registry, listAtom);
    const result = yield* AtomRegistry.getResult(registry, atom);
    const after = yield* AtomRegistry.getResult(registry, listAtom, {
      suspendOnWaiting: true,
    });
    return { result, after: after as ReadonlyArray<Member> };
  });
};

describe("members mock", () => {
  it.effect("lists the org's members with roles and MFA extensions", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const rows = (yield* AtomRegistry.getResult(
        registry,
        listAtom,
      )) as ReadonlyArray<Member>;
      assert.isAbove(rows.length, 0);
      assert.isTrue(
        rows.some((row) => row.id === people.alex.id && row.role === "owner"),
      );
      assert.strictEqual(
        rows.find((row) => row.id === people.sam.id)?.mfaExtension,
        "Acme Security Keys",
      );
    }),
  );

  it.effect("exercises every member mutation and refreshes the list", () =>
    Effect.gen(function* () {
      const grant = yield* run(ApiClient.mutation("members", "grantOwner"), {
        params: { orgId, userId: people.priya.id },
      });
      assert.strictEqual((grant.result as { ok: boolean }).ok, true);
      assert.strictEqual(
        grant.after.find((row) => row.id === people.priya.id)?.role,
        "owner",
      );

      const revoke = yield* run(ApiClient.mutation("members", "revokeOwner"), {
        params: { orgId, userId: people.priya.id },
        payload: { role: "member" },
      });
      assert.strictEqual((revoke.result as { ok: boolean }).ok, true);

      const role = yield* run(ApiClient.mutation("members", "setMemberRole"), {
        params: { orgId, userId: people.jordan.id },
        payload: { role: "admin" },
      });
      assert.strictEqual(
        role.after.find((row) => row.id === people.jordan.id)?.role,
        "admin",
      );

      const setMfa = yield* run(
        ApiClient.mutation("members", "setMemberMfaExtension"),
        {
          params: { orgId, userId: people.casey.id },
          payload: { extensionName: "Sample Keys" },
        },
      );
      assert.strictEqual(
        setMfa.after.find((row) => row.id === people.casey.id)?.mfaExtension,
        "Sample Keys",
      );

      const clearMfa = yield* run(
        ApiClient.mutation("members", "clearMemberMfaExtension"),
        { params: { orgId, userId: people.casey.id } },
      );
      assert.isNull(
        clearMfa.after.find((row) => row.id === people.casey.id)?.mfaExtension,
      );

      const remove = yield* run(ApiClient.mutation("members", "removeMember"), {
        params: { orgId, userId: people.casey.id },
      });
      assert.strictEqual((remove.result as { ok: boolean }).ok, true);
      assert.isNotNull(
        remove.after.find((row) => row.id === people.casey.id)?.removedAt,
      );

      const restore = yield* run(
        ApiClient.mutation("members", "restoreMember"),
        {
          params: { orgId, userId: people.casey.id },
          payload: { role: "member" },
        },
      );
      assert.isNull(
        restore.after.find((row) => row.id === people.casey.id)?.removedAt,
      );

      const invite = yield* run(ApiClient.mutation("members", "invite"), {
        params: { orgId },
        payload: { email: "new-member@example.com", role: "member" },
      });
      assert.strictEqual(
        (invite.result as { invitation: { email: string } }).invitation.email,
        "new-member@example.com",
      );
    }),
  );
});
