import { DateTime, Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  activitySeed,
  dashboardSeed,
  historySeed,
  kickbackSeed,
  previewSeed,
  refereeSeed,
  transferSeed,
} from "./fixtures.ts";

const stringField = (
  input: Record<string, unknown>,
  key: string,
  fallback: string,
) => (typeof input[key] === "string" ? (input[key] as string) : fallback);

const numberField = (
  input: Record<string, unknown>,
  key: string,
  fallback: number,
) => (typeof input[key] === "number" ? input[key] : fallback);

export const ReferralsMock = mockGroup("referrals", (handlers) =>
  Effect.gen(function* () {
    const history = yield* Ref.make(structuredClone(historySeed));
    const code = yield* Ref.make(dashboardSeed.code);
    const appliedCredits = yield* Ref.make(0);
    const tracked = yield* Ref.make<Array<Record<string, unknown>>>(
      structuredClone(activitySeed),
    );

    return handlers
      .handle("dashboard", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(history);
          const referralCode = yield* Ref.get(code);
          const credited = rows.filter((row) => row.status === "credited");
          return {
            ...dashboardSeed,
            code: referralCode,
            shareUrl: `https://capy.example.com/referrals/${referralCode}`,
            referredCount: rows.length,
            pendingCount: rows.filter((row) => row.status === "pending").length,
            creditedCount: credited.length,
            totalCredits: credited.reduce((sum, row) => sum + row.credits, 0),
          };
        }),
      )
      .handle("list", () => Ref.get(history))
      .handle("kickbacks", () => Effect.succeed(kickbackSeed))
      .handle("preview", () =>
        Effect.gen(function* () {
          const referralCode = yield* Ref.get(code);
          return {
            ...previewSeed,
            code: referralCode,
            shareUrl: `https://capy.example.com/referrals/${referralCode}`,
          };
        }),
      )
      .handle("referee", () =>
        Effect.gen(function* () {
          const credits = yield* Ref.get(appliedCredits);
          return { ...refereeSeed, appliedCredits: credits };
        }),
      )
      .handle("transfers", () => Effect.succeed(transferSeed))
      .handle("apply", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const referralCode = stringField(input, "code", dashboardSeed.code);
          const credits = numberField(
            input,
            "credits",
            refereeSeed.rewardCredits,
          );
          yield* Ref.set(appliedCredits, credits);
          yield* Ref.set(code, referralCode);
          return {
            ok: true,
            code: referralCode,
            credits,
            status: "applied",
            appliedAt: DateTime.formatIso(minutesAgo(0)),
          };
        }),
      )
      .handle("invite", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const email = stringField(input, "email", "teammate@example.com");
          const invitedBy = stringField(input, "invitedBy", people.alex.id);
          const invitation = {
            id: newId("ref"),
            email,
            invitedBy,
            code: yield* Ref.get(code),
            shareUrl: `https://capy.example.com/referrals/${yield* Ref.get(code)}`,
            status: "invited",
            createdAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.update(history, (rows) => [
            ...rows,
            {
              id: invitation.id,
              email,
              name: email.split("@")[0] ?? email,
              status: "pending" as const,
              credits: 0,
              joinedAt: invitation.createdAt,
              creditedAt: null,
            },
          ]);
          return invitation;
        }),
      )
      .handle("track", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const activity = {
            id: newId("ra"),
            kind: stringField(input, "kind", "thread"),
            actor: stringField(input, "actor", people.alex.id),
            title: stringField(input, "title", "Referred activity"),
            threadId: stringField(input, "threadId", ""),
            projectId: stringField(input, "projectId", ""),
            occurredAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.update(tracked, (rows) => [activity, ...rows]);
          return {
            ok: true,
            activity,
            tracked: (yield* Ref.get(tracked)).length,
          };
        }),
      );
  }),
);
