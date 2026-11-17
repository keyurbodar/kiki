import { Effect, Ref } from "effect";
import { MockDb, missing } from "../db/MockDb.ts";
import { isoMinutesAgo, people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { invitationHistory } from "./fixtures.ts";

type Row = Record<string, unknown>;

export const InvitationsMock = mockGroup("invitations", (handlers) =>
  Effect.gen(function* () {
    const { pendingInvitations, members } = yield* MockDb;
    const history = yield* Ref.make<ReadonlyArray<Row>>(
      structuredClone(invitationHistory) as ReadonlyArray<Row>,
    );

    const findInvitation = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(pendingInvitations);
        const invitation = rows.find((row) => row.id === id);
        if (!invitation) return yield* missing("pendingInvitations", id);
        return invitation;
      });

    return handlers
      .handle("listInvitations", () =>
        Effect.gen(function* () {
          const pending = yield* Ref.get(pendingInvitations);
          const resolved = yield* Ref.get(history);
          return {
            invitations: pending.map((invitation) => ({
              ...invitation,
              status: "pending",
            })),
            history: resolved,
          };
        }),
      )
      .handle("acceptInvitation", ({ params }) =>
        Effect.gen(function* () {
          const invitation = yield* findInvitation(params.invitationId);
          const firstName = "Taylor";
          const lastName = "Sample";
          const member = {
            id: `user_sample_${firstName.toLowerCase()}`,
            firstName,
            lastName,
            email: invitation.email,
            githubLogin: `${firstName.toLowerCase()}-sample`,
            role: invitation.role,
            joinedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(members, (rows) =>
            rows.some((row) => row.id === member.id)
              ? rows
              : [...rows, member as (typeof rows)[number]],
          );
          yield* Ref.set(
            pendingInvitations,
            (yield* Ref.get(pendingInvitations)).filter(
              (row) => row.id !== params.invitationId,
            ),
          );
          yield* Ref.update(history, (rows) => [
            {
              id: `inv_hist_${params.invitationId}`,
              email: invitation.email,
              role: invitation.role,
              invitedBy: invitation.invitedBy,
              status: "accepted",
              createdAt: invitation.createdAt,
              resolvedAt: isoMinutesAgo(0),
            },
            ...rows,
          ]);
          return {
            ok: true,
            invitationId: params.invitationId,
            member,
            acceptedBy: people.alex.id,
          };
        }),
      )
      .handle("revokeInvitation", ({ params }) =>
        Effect.gen(function* () {
          const invitation = yield* findInvitation(params.invitationId);
          yield* Ref.set(
            pendingInvitations,
            (yield* Ref.get(pendingInvitations)).filter(
              (row) => row.id !== params.invitationId,
            ),
          );
          yield* Ref.update(history, (rows) => [
            {
              id: `inv_hist_${params.invitationId}`,
              email: invitation.email,
              role: invitation.role,
              invitedBy: invitation.invitedBy,
              status: "revoked",
              createdAt: invitation.createdAt,
              resolvedAt: isoMinutesAgo(0),
            },
            ...rows,
          ]);
          return {
            ok: true,
            invitationId: params.invitationId,
            email: invitation.email,
            revoked: true,
          };
        }),
      );
  }),
);
