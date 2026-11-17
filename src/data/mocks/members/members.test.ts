import { assert, describe, it } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type {
  Invitation,
  OrganizationMember,
} from "../../api/schemas/member.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

const memberKeys = [`org_user:${orgId}`];
const invitationKeys = [`org_invitation:${orgId}`];

const membersAtom = ApiClient.query("members", "listMembers", {
  params: { orgId },
  query: { includeDisabled: "true" },
  reactivityKeys: memberKeys,
});
const invitationsAtom = ApiClient.query("invitations", "listInvitations", {
  params: { orgId },
  reactivityKeys: invitationKeys,
});
const invite = ApiClient.mutation("members", "invite");
const setRole = ApiClient.mutation("members", "setMemberRole");
const remove = ApiClient.mutation("members", "removeMember");
const restore = ApiClient.mutation("members", "restoreMember");
const extend = ApiClient.mutation("members", "setMemberMfaExtension");
const revoke = ApiClient.mutation("invitations", "revokeInvitation");

const find = (rows: ReadonlyArray<OrganizationMember>, userId: string) =>
  rows.find((row) => row.userId === userId);
const emails = (rows: ReadonlyArray<Invitation>) =>
  rows.map((row) => row.email);

describe("members and invitations mocks", () => {
  it.effect("lists the org's members and pending invitations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const members = yield* AtomRegistry.getResult(registry, membersAtom);
      assert.strictEqual(members.length, 5);
      assert.strictEqual(
        find(members, "user_sample_alex")?.accessLevel,
        "owner",
      );
      const invitations = yield* AtomRegistry.getResult(
        registry,
        invitationsAtom,
      );
      assert.deepStrictEqual(emails(invitations), ["taylor@example.com"]);
    }),
  );

  it.effect("invites new addresses and skips members and invalid ones", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(invitationsAtom);
      yield* AtomRegistry.getResult(registry, invitationsAtom);
      registry.set(invite, {
        params: { orgId },
        payload: { emails: ["new@example.com", "sam@example.com", "nope"] },
        reactivityKeys: invitationKeys,
      });
      const outcomes = yield* AtomRegistry.getResult(registry, invite);
      assert.deepStrictEqual(
        outcomes.map((outcome) => outcome.status),
        ["invited", "already_member", "invalid"],
      );
      const after = yield* AtomRegistry.getResult(registry, invitationsAtom, {
        suspendOnWaiting: true,
      });
      assert.include(emails(after), "new@example.com");

      const created = outcomes[0]?.invitation;
      assert.isDefined(created);
      registry.set(revoke, {
        params: { orgId, invitationId: created?.id ?? "" },
        reactivityKeys: invitationKeys,
      });
      yield* AtomRegistry.getResult(registry, revoke);
      const revoked = yield* AtomRegistry.getResult(registry, invitationsAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(emails(revoked), "new@example.com");
    }),
  );

  it.effect("changes roles, removes, restores and extends members", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(membersAtom);
      yield* AtomRegistry.getResult(registry, membersAtom);
      const userId = "user_sample_priya";
      const params = { orgId, userId };
      const read = () =>
        AtomRegistry.getResult(registry, membersAtom, {
          suspendOnWaiting: true,
        }).pipe(Effect.map((rows) => find(rows, userId)));

      registry.set(setRole, {
        params,
        payload: { accessLevel: "admin" },
        reactivityKeys: memberKeys,
      });
      yield* AtomRegistry.getResult(registry, setRole);
      assert.strictEqual((yield* read())?.accessLevel, "admin");

      registry.set(remove, { params, reactivityKeys: memberKeys });
      yield* AtomRegistry.getResult(registry, remove);
      assert.isTrue((yield* read())?.disabled);

      registry.set(restore, {
        params,
        payload: { accessLevel: "member" },
        reactivityKeys: memberKeys,
      });
      yield* AtomRegistry.getResult(registry, restore);
      const restored = yield* read();
      assert.isFalse(restored?.disabled);
      assert.strictEqual(restored?.accessLevel, "member");

      const until = DateTime.makeUnsafe("2026-04-01T00:00:00.000Z");
      registry.set(extend, {
        params,
        payload: { until },
        reactivityKeys: memberKeys,
      });
      yield* AtomRegistry.getResult(registry, extend);
      const extended = (yield* read())?.mfaExtendedUntil;
      assert.strictEqual(
        extended === null || extended === undefined
          ? undefined
          : DateTime.formatIso(extended),
        "2026-04-01T00:00:00.000Z",
      );
    }),
  );
});
