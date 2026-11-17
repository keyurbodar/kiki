import { Effect, Ref } from "effect";
import { MockDb, missing } from "../db/MockDb.ts";
import { toInvitation } from "../members/index.ts";
import { mockGroup } from "../mockGroup.ts";

export const InvitationsMock = mockGroup("invitations", (handlers) =>
  Effect.gen(function* () {
    const { pendingInvitations } = yield* MockDb;

    return handlers
      .handle("listInvitations", () =>
        Ref.get(pendingInvitations).pipe(
          Effect.map((rows) => rows.map(toInvitation)),
        ),
      )
      .handle("revokeInvitation", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(pendingInvitations);
          if (!rows.some((row) => row.id === params.invitationId)) {
            return yield* missing("pendingInvitations", params.invitationId);
          }
          yield* Ref.set(
            pendingInvitations,
            rows.filter((row) => row.id !== params.invitationId),
          );
          return { ok: true };
        }),
      );
  }),
);
