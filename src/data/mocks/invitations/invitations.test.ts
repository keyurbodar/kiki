import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Invitation {
  readonly id: string;
  readonly email: string;
  readonly status: string;
}

interface InvitationList {
  readonly invitations: ReadonlyArray<Invitation>;
  readonly history: ReadonlyArray<Invitation>;
}

const key = `invitations:${orgId}`;
const listAtom = ApiClient.query("invitations", "listInvitations", {
  params: { orgId },
  reactivityKeys: [key],
});
const run = <A, I extends object>(
  atom: import("effect/reactivity/Atom").AtomResultFn<I, A, unknown>,
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
    return { result, after: after as InvitationList };
  });
};

describe("invitations mock", () => {
  it.effect("lists pending invitations and accepted history", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const value = (yield* AtomRegistry.getResult(
        registry,
        listAtom,
      )) as InvitationList;
      assert.strictEqual(value.invitations[0]?.email, "taylor@example.com");
      assert.strictEqual(value.invitations[0]?.status, "pending");
      assert.isAbove(value.history.length, 0);
    }),
  );

  it.effect("accepts an invitation and refreshes the list", () =>
    Effect.gen(function* () {
      const accepted = yield* run(
        ApiClient.mutation("invitations", "acceptInvitation"),
        {
          params: { invitationId: "inv_sample_taylor" },
          payload: { firstName: "Taylor", lastName: "Sample" },
        },
      );
      assert.strictEqual((accepted.result as { ok: boolean }).ok, true);
      assert.strictEqual(accepted.after.invitations.length, 0);
      assert.strictEqual(accepted.after.history[0]?.status, "accepted");
    }),
  );

  it.effect("revokes a pending invitation", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      const revoke = ApiClient.mutation("invitations", "revokeInvitation");
      registry.set(revoke, {
        params: { orgId, invitationId: "inv_sample_taylor" },
        reactivityKeys: [key],
      });
      const revoked = yield* AtomRegistry.getResult(registry, revoke);
      assert.strictEqual((revoked as { ok: boolean }).ok, true);
      const after = (yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      })) as InvitationList;
      assert.strictEqual(after.invitations.length, 0);
    }),
  );
});
