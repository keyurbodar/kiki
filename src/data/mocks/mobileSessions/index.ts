import { Effect, Ref } from "effect";
import { MockDb } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { type MobileSession, sampleSessions, stoppedAt } from "./fixtures.ts";

export const MobileSessionsMock = mockGroup("mobileSessions", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const sessions = yield* Ref.make<ReadonlyArray<MobileSession>>([
      ...sampleSessions,
    ]);

    const find = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(sessions);
        const session = rows.find((row) => row.id === id);
        if (!session) {
          return yield* Effect.die(
            new Error(`mobileSessions.sessions: no row ${id}`),
          );
        }
        return session;
      });

    const withThread = (session: MobileSession) =>
      Effect.gen(function* () {
        const threads = [
          {
            id: "jam_sample_0001",
            number: 41,
            title: "Fix flaky checkout test",
            projectId: "proj_sample_web",
          },
          {
            id: "jam_sample_0002",
            number: 40,
            title: "Add dark mode to settings",
            projectId: "proj_sample_web",
          },
        ];
        const thread = threads.find((row) => row.id === session.jamId);
        return { ...session, thread: thread ?? null };
      });

    return handlers
      .handle("list", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(sessions);
          return yield* Effect.forEach(
            rows.filter((row) => row.jamId === params.jamId),
            withThread,
          );
        }),
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const session = yield* find(params.sessionId);
          const devices = yield* Ref.get(db.devices);
          return {
            ...(yield* withThread(session)),
            device: devices.find((row) => row.id === session.deviceId) ?? null,
          };
        }),
      )
      .handle("stop", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* find(params.sessionId);
          const updated: MobileSession = {
            ...current,
            status: "stopped",
            stoppedAt: stoppedAt(),
          };
          yield* Ref.update(sessions, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      );
  }),
);
