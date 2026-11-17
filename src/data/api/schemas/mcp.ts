import { Schema } from "effect";

export const CompleteMcpOAuthRequest = Schema.Struct({
  state: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512)),
  code: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2048)),
  ),
  iss: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(500)),
  ),
  error: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100)),
  ),
}).annotate({ identifier: "CompleteMcpOAuthRequest" });

export class McpOAuthCompletion extends Schema.Class<McpOAuthCompletion>(
  "McpOAuthCompletion",
)({
  result: Schema.Literals(["connected", "denied", "failed"]),
  destination: Schema.String,
  setupId: Schema.optional(Schema.String),
  desktopScheme: Schema.optional(Schema.String),
}) {}
