import { Effect, Ref } from "effect";
import { MockDb, missing } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";

export const InvitationsMock = mockGroup("invitations", (handlers) =>
  Effect.gen(function* () {
    const { myInvitations } = yield* MockDb;

    return handlers.handle("acceptInvitation", ({ params }) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(myInvitations);
        const row = rows.find(
          (candidate) => candidate.id === params.invitationId,
        );
        if (!row) return yield* missing("myInvitations", params.invitationId);
        yield* Ref.set(
          myInvitations,
          rows.filter((candidate) => candidate !== row),
        );
        return { id: row.orgId, name: row.orgName };
      }),
    );
  }),
);
