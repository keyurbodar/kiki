import { Effect } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { seedSessions } from "./fixtures.ts";

export const ThreadSessionsMock = mockGroup("threadSessions", (handlers) =>
  Effect.sync(() =>
    handlers.handle("list", ({ params }) =>
      Effect.succeed(
        seedSessions.filter((session) => session.threadId === params.jamId),
      ),
    ),
  ),
);
