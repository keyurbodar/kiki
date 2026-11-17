import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import {
  joinableOrganizationsAtom,
  myInvitationsAtom,
} from "@/data/atoms/invitations";

describe("invitations over MockServices", () => {
  it.effect("lists the viewer's invitations and joinable organizations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const invitations = yield* AtomRegistry.getResult(
        registry,
        myInvitationsAtom,
      );
      const organizations = yield* AtomRegistry.getResult(
        registry,
        joinableOrganizationsAtom,
      );
      assert.deepStrictEqual(
        invitations.map((invitation) => invitation.orgName),
        ["Globex", "Initech"],
      );
      assert.deepStrictEqual(
        organizations.map((organization) => organization.orgName),
        ["Umbrella Studio"],
      );
    }),
  );
});
