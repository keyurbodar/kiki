import { Effect } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { agentModels } from "../volumes/agent-drive.ts";

export const ModelsMock = mockGroup("models", (handlers) =>
  Effect.succeed(handlers.handle("list", () => Effect.succeed(agentModels))),
);
