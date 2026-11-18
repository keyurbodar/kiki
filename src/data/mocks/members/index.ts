import { Effect, Ref } from "effect";
import { fields, MockDb, missing } from "../db/MockDb.ts";
import { isoMinutesAgo, people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  memberAccessOverrides,
  memberActivity,
  memberMfaExtensions,
  memberProtection,
} from "./fixtures.ts";

type Row = Record<string, unknown>;

const string = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const role = (value: unknown): string | undefined =>
  value === "owner" || value === "admin" || value === "member"
    ? value
    : undefined;

const findMember = (userId: string) =>
  Effect.gen(function* () {
    const { members } = yield* MockDb;
    const rows = yield* Ref.get(members);
    const member = rows.find((row) => row.id === userId);
    if (!member) return yield* missing("members", userId);
    return member;
  });

const replaceMember = (userId: string, change: (member: Row) => Row) =>
  Effect.gen(function* () {
    const { members } = yield* MockDb;
    const rows = yield* Ref.get(members);
    if (!rows.some((row) => row.id === userId)) {
      return yield* missing("members", userId);
    }
    const updated = rows.map((row) => (row.id === userId ? change(row) : row));
    yield* Ref.set(members, updated as typeof rows);
    return updated.find((row) => row.id === userId)!;
  });

const recordActivity = (
  activity: Ref.Ref<ReadonlyArray<Row>>,
  userId: string,
  summary: string,
) =>
  Ref.update(activity, (rows) => [
    {
      id: `act_member_${rows.length + 1}`,
      userId,
      summary,
      createdAt: isoMinutesAgo(0),
    },
    ...rows,
  ]);

/** Capy's dialog trims and splits on whitespace, commas and semicolons. */
const trimAddress = (value: string) =>
  value.trim().replace(/^[<"']|[>"']$/g, "");

const emailPattern = /^[^\s@]+@[^\s@.]+\.[^\s@.]+$/u;

const isEmailAddress = (value: string) => emailPattern.test(value);

export const MembersMock = mockGroup("members", (handlers) =>
  Effect.gen(function* () {
    const { members, pendingInvitations } = yield* MockDb;
    const extensions = yield* Ref.make<Readonly<Record<string, string>>>(
      structuredClone(memberMfaExtensions),
    );
    const protection = yield* Ref.make<Readonly<Record<string, Row>>>(
      structuredClone(memberProtection) as Readonly<Record<string, Row>>,
    );
    const access = yield* Ref.make<Readonly<Record<string, Row>>>(
      Object.fromEntries(
        Object.entries(memberAccessOverrides).map(([id, value]) => [
          id,
          { ...value },
        ]),
      ) as Readonly<Record<string, Row>>,
    );
    const activity = yield* Ref.make<ReadonlyArray<Row>>(
      structuredClone(memberActivity) as ReadonlyArray<Row>,
    );

    return handlers
      .handle("listMembers", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(members);
          const mfa = yield* Ref.get(extensions);
          const overrides = yield* Ref.get(access);
          const identity = yield* Ref.get(protection);
          return rows.map((member) => {
            const state = overrides[member.id] as
              | { readonly removedAt?: string | null; readonly role?: string }
              | undefined;
            const facts = identity[member.id] as
              | {
                  readonly mfaEnabled?: boolean;
                  readonly passkeyTrusted?: boolean;
                  readonly enterpriseSso?: boolean;
                }
              | undefined;
            const mfaExtension = mfa[member.id] ?? null;
            return {
              ...member,
              role: state?.role ?? member.role,
              removedAt: state?.removedAt ?? null,
              isRemoved:
                state?.removedAt === null || state?.removedAt !== undefined,
              mfaExtension,
              mfaEnabled: facts?.mfaEnabled === true || mfaExtension !== null,
              passkeyTrusted: facts?.passkeyTrusted === true,
              enterpriseSso: facts?.enterpriseSso === true,
            };
          });
        }),
      )
      .handle("grantOwner", ({ params }) =>
        Effect.gen(function* () {
          const member = yield* findMember(params.userId);
          const updated = yield* replaceMember(params.userId, (row) => ({
            ...row,
            role: "owner",
          }));
          yield* recordActivity(
            activity,
            params.userId,
            "Granted owner access",
          );
          return {
            ok: true,
            userId: params.userId,
            previousRole: member.role,
            member: updated,
          };
        }),
      )
      .handle("setMemberMfaExtension", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findMember(params.userId);
          const input = fields(payload);
          const name =
            string(input.extensionName) ??
            string(input.name) ??
            "Acme Security Keys";
          yield* Ref.update(extensions, (rows) => ({
            ...rows,
            [params.userId]: name,
          }));
          yield* recordActivity(
            activity,
            params.userId,
            `MFA extension set to ${name}`,
          );
          return { ok: true, userId: params.userId, extensionName: name };
        }),
      )
      .handle("clearMemberMfaExtension", ({ params }) =>
        Effect.gen(function* () {
          yield* findMember(params.userId);
          const name = (yield* Ref.get(extensions))[params.userId] ?? null;
          yield* Ref.update(extensions, (rows) => {
            const next = { ...rows };
            delete next[params.userId];
            return next;
          });
          yield* recordActivity(
            activity,
            params.userId,
            "Removed MFA extension",
          );
          return { ok: true, userId: params.userId, removedExtension: name };
        }),
      )
      .handle("removeMember", ({ params }) =>
        Effect.gen(function* () {
          const member = yield* findMember(params.userId);
          const removedAt = isoMinutesAgo(0);
          yield* Ref.update(access, (rows) => ({
            ...rows,
            [params.userId]: { ...member, removedAt },
          }));
          yield* recordActivity(activity, params.userId, "Removed from Acme");
          return {
            ok: true,
            userId: params.userId,
            removedAt,
            email: member.email,
          };
        }),
      )
      .handle("restoreMember", ({ params, payload }) =>
        Effect.gen(function* () {
          const member = yield* findMember(params.userId);
          const input = fields(payload);
          const restoredRole = role(input.role) ?? member.role;
          yield* Ref.update(access, (rows) => ({
            ...rows,
            [params.userId]: { ...member, role: restoredRole, removedAt: null },
          }));
          yield* replaceMember(params.userId, (row) => ({
            ...row,
            role: restoredRole,
          }));
          yield* recordActivity(activity, params.userId, "Restored to Acme");
          return {
            ok: true,
            userId: params.userId,
            role: restoredRole,
            member: { ...member, role: restoredRole },
          };
        }),
      )
      .handle("revokeOwner", ({ params, payload }) =>
        Effect.gen(function* () {
          const member = yield* findMember(params.userId);
          const input = fields(payload);
          const nextRole = role(input.role) ?? "member";
          const updated = yield* replaceMember(params.userId, (row) => ({
            ...row,
            role: nextRole,
          }));
          yield* recordActivity(
            activity,
            params.userId,
            "Revoked owner access",
          );
          return {
            ok: true,
            userId: params.userId,
            previousRole: member.role,
            member: updated,
          };
        }),
      )
      .handle("setMemberRole", ({ params, payload }) =>
        Effect.gen(function* () {
          yield* findMember(params.userId);
          const input = fields(payload);
          const nextRole =
            role(input.role) ??
            role(input.memberRole) ??
            role(input.value) ??
            "member";
          const updated = yield* replaceMember(params.userId, (row) => ({
            ...row,
            role: nextRole,
          }));
          yield* Ref.update(access, (rows) => ({
            ...rows,
            [params.userId]: { role: nextRole, removedAt: null },
          }));
          yield* recordActivity(
            activity,
            params.userId,
            `Role changed to ${nextRole}`,
          );
          return {
            ok: true,
            userId: params.userId,
            role: nextRole,
            member: updated,
          };
        }),
      )
      .handle("invite", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const requested = Array.isArray(input.emails)
            ? input.emails.flatMap((entry) => {
                const value = string(entry);
                return value === undefined ? [] : [value];
              })
            : [string(input.email)].flatMap((value) =>
                value === undefined ? [] : [value],
              );
          const addresses = [...new Set(requested.map(trimAddress))].filter(
            (email) => email !== "",
          );
          const currentMembers = yield* Ref.get(members);
          const taken = new Set(
            currentMembers.map((row) => trimAddress(row.email).toLowerCase()),
          );
          const outcomes: Array<{ email: string; status: string }> = [];
          for (const email of addresses) {
            const key = email.toLowerCase();
            if (!isEmailAddress(email) || taken.has(key)) {
              outcomes.push({
                email,
                status: taken.has(key) ? "already_member" : "invalid",
              });
              continue;
            }
            taken.add(key);
            const invite = {
              id: `inv_mock_${(yield* Ref.get(pendingInvitations)).length + 1}`,
              email,
              role: role(input.role) ?? "member",
              invitedBy: people.alex.id,
              createdAt: isoMinutesAgo(0),
              expiresAt: isoMinutesAgo(-7 * 24 * 60),
            };
            yield* Ref.update(pendingInvitations, (rows) => [...rows, invite]);
            outcomes.push({ email, status: "invited" });
          }
          const invited = outcomes.filter(
            (outcome) => outcome.status === "invited",
          );
          return {
            ok: true,
            invitations: outcomes,
            sent: invited.length,
            skipped: outcomes
              .filter((outcome) => outcome.status !== "invited")
              .map((outcome) => outcome.email),
          };
        }),
      );
  }),
);
