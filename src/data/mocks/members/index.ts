import { DateTime, Effect, Ref } from "effect";
import { UserId } from "../../api/schemas/ids.ts";
import {
  Invitation,
  InviteOutcome,
  OrganizationMember,
} from "../../api/schemas/member.ts";
import { MockDb, missing, newId, type Row } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";

type MemberState = {
  readonly disabled: boolean;
  readonly mfaExtendedUntil: DateTime.Utc | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toMember = (row: Row<"members">, state: MemberState | undefined) =>
  new OrganizationMember({
    userId: UserId.make(row.id),
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    imageUrl: null,
    accessLevel: row.role as OrganizationMember["accessLevel"],
    disabled: state?.disabled ?? false,
    createdAt: DateTime.makeUnsafe(row.joinedAt),
    githubLogin: row.githubLogin,
    mfaEnabled: false,
    enterpriseSso: false,
    passkeyTrusted: false,
    mfaExtendedUntil: state?.mfaExtendedUntil ?? null,
  });

export const toInvitation = (row: Row<"pendingInvitations">) =>
  new Invitation({
    id: row.id,
    email: row.email,
    invitedByUserId: UserId.make(row.invitedBy),
    expiresAt: DateTime.makeUnsafe(row.expiresAt),
    createdAt: DateTime.makeUnsafe(row.createdAt),
  });

export const MembersMock = mockGroup("members", (handlers) =>
  Effect.gen(function* () {
    const { members, pendingInvitations } = yield* MockDb;
    const states = yield* Ref.make(new Map<string, MemberState>());

    const patchState = (userId: string, patch: Partial<MemberState>) =>
      Ref.update(states, (current) => {
        const next = new Map(current);
        next.set(userId, {
          disabled: false,
          mfaExtendedUntil: null,
          ...current.get(userId),
          ...patch,
        });
        return next;
      });

    const requireMember = (userId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(members);
        const row = rows.find((candidate) => candidate.id === userId);
        if (!row) return yield* missing("members", userId);
        return row;
      });

    const setRole = (userId: string, role: string) =>
      Effect.gen(function* () {
        yield* requireMember(userId);
        yield* Ref.update(members, (rows) =>
          rows.map((row) => (row.id === userId ? { ...row, role } : row)),
        );
        return { ok: true };
      });

    return handlers
      .handle("listMembers", ({ query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(members);
          const current = yield* Ref.get(states);
          const all = rows.map((row) => toMember(row, current.get(row.id)));
          return query.includeDisabled === "true"
            ? all
            : all.filter((member) => !member.disabled);
        }),
      )
      .handle("invite", ({ payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(members);
          const outcomes: Array<InviteOutcome> = [];
          for (const raw of payload.emails) {
            const email = raw.trim().toLowerCase();
            if (!emailPattern.test(email)) {
              outcomes.push(
                new InviteOutcome({
                  email: raw,
                  status: "invalid",
                  invitation: null,
                }),
              );
              continue;
            }
            if (rows.some((row) => row.email.toLowerCase() === email)) {
              outcomes.push(
                new InviteOutcome({
                  email: raw,
                  status: "already_member",
                  invitation: null,
                }),
              );
              continue;
            }
            const row = {
              id: newId("inv"),
              email,
              role: "member",
              invitedBy: rows[0]?.id ?? "user_sample_alex",
              createdAt: isoMinutesAgo(0),
              expiresAt: isoMinutesAgo(-7 * 24 * 60),
            };
            yield* Ref.update(pendingInvitations, (all) => [...all, row]);
            outcomes.push(
              new InviteOutcome({
                email,
                status: "invited",
                invitation: toInvitation(row),
              }),
            );
          }
          return outcomes;
        }),
      )
      .handle("setMemberRole", ({ params, payload }) =>
        setRole(params.userId, payload.accessLevel),
      )
      .handle("grantOwner", ({ params }) => setRole(params.userId, "owner"))
      .handle("revokeOwner", ({ params, payload }) =>
        setRole(params.userId, payload.accessLevel),
      )
      .handle("removeMember", ({ params }) =>
        requireMember(params.userId).pipe(
          Effect.andThen(patchState(params.userId, { disabled: true })),
          Effect.as({ ok: true }),
        ),
      )
      .handle("restoreMember", ({ params, payload }) =>
        setRole(params.userId, payload.accessLevel).pipe(
          Effect.andThen(patchState(params.userId, { disabled: false })),
          Effect.as({ ok: true }),
        ),
      )
      .handle("setMemberMfaExtension", ({ params, payload }) =>
        requireMember(params.userId).pipe(
          Effect.andThen(
            patchState(params.userId, { mfaExtendedUntil: payload.until }),
          ),
          Effect.as({ ok: true }),
        ),
      )
      .handle("clearMemberMfaExtension", ({ params }) =>
        requireMember(params.userId).pipe(
          Effect.andThen(patchState(params.userId, { mfaExtendedUntil: null })),
          Effect.as({ ok: true }),
        ),
      );
  }),
);
