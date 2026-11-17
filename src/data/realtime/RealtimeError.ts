import { Schema } from "effect";

export class RealtimeError extends Schema.TaggedError<RealtimeError>()(
  "RealtimeError",
  {
    channel: Schema.Literals(["events", "socket"]),
    message: Schema.String,
  },
) {}
