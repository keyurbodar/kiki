import { Effect, Ref } from "effect";
import { fields, MockDb, newId, notFound } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleHandoff } from "./fixtures.ts";

type Handoff = Record<string, unknown> & {
  readonly id: string;
  readonly threadId: string;
};

export const HandoffsMock = mockGroup("handoffs", (handlers) =>
  Effect.gen(function* () {
    const { members } = yield* MockDb;
    const handoffs = yield* Ref.make<ReadonlyArray<Handoff>>([
      structuredClone(sampleHandoff),
    ]);

    return handlers
      .handle("open", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const memberIds = (yield* Ref.get(members)).map(
            (member) => member.id,
          );
          const toUserId = String(
            input.toUserId ?? input.assigneeId ?? memberIds[1] ?? "",
          );
          if (toUserId && !memberIds.includes(toUserId)) {
            return yield* notFound("members", toUserId);
          }
          const handoff: Handoff = {
            id: newId("handoff"),
            threadId: params.jamId,
            status: "open",
            fromUserId: memberIds[0] ?? "",
            toUserId,
            reason: String(input.reason ?? "Take over from here."),
            summary: String(input.summary ?? ""),
            instructions: String(input.instructions ?? ""),
            threadTitle: String(input.threadTitle ?? ""),
            createdAt: sampleHandoff.createdAt,
            updatedAt: sampleHandoff.updatedAt,
            canceledAt: null,
          };
          yield* Ref.update(handoffs, (rows) => [handoff, ...rows]);
          return handoff;
        }),
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(handoffs);
          const handoff = rows.find((row) => row.threadId === params.jamId);
          if (!handoff) {
            return yield* Effect.die(
              new Error(`handoffs: no open handoff for thread ${params.jamId}`),
            );
          }
          return handoff;
        }),
      )
      .handle("cancel", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(handoffs);
          const handoff = rows.find((row) => row.id === params.handoffId);
          if (!handoff) {
            return yield* Effect.die(
              new Error(`handoffs: no row ${params.handoffId}`),
            );
          }
          const canceled = {
            ...handoff,
            status: "canceled",
            canceledAt: sampleHandoff.updatedAt,
          };
          yield* Ref.set(
            handoffs,
            rows.map((row) => (row.id === handoff.id ? canceled : row)),
          );
          return canceled;
        }),
      );
  }),
);
