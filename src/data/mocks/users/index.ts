import { Effect } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { sampleUser } from "./fixtures.ts";

export const UsersMock = mockGroup("users", (handlers) =>
  Effect.succeed(
    handlers.handle("getCurrent", () => Effect.succeed(sampleUser)),
  ),
);
