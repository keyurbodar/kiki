import { Effect, Schema } from "effect";
import {
  CancelMessageOutcome,
  ContextUsage,
  SendNowOutcome,
} from "../../events/events.ts";
import { mockGroup } from "../mockGroup.ts";
import { emptyContextUsage, sampleContextUsage } from "./fixtures.ts";

export const EventsMock = mockGroup("events", (handlers) =>
  Effect.succeed(
    handlers
      .handle("contextUsage", ({ params }) =>
        Effect.succeed(
          Schema.decodeUnknownSync(ContextUsage)(
            sampleContextUsage[params.jamId] ?? emptyContextUsage,
          ),
        ),
      )
      .handle("sendNowMessage", ({ params }) =>
        Effect.succeed(
          Schema.decodeUnknownSync(SendNowOutcome)({
            outcome: "sent",
            id: params.eventId,
          }),
        ),
      )
      .handle("cancelMessage", () =>
        Effect.succeed(new CancelMessageOutcome({ outcome: "cancelled" })),
      ),
  ),
);
