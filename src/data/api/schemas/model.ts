import { Schema } from "effect";

export const ReasoningMode = Schema.Literals([
  "none",
  "instant",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);
export type ReasoningMode = typeof ReasoningMode.Type;

export class PickerModel extends Schema.Class<PickerModel>("PickerModel")({
  id: Schema.String,
  name: Schema.String,
  provider: Schema.String,
  auth: Schema.String,
  byok: Schema.optional(Schema.Boolean),
  defaultFavorite: Schema.Boolean,
  efforts: Schema.Array(ReasoningMode),
  defaultEffort: Schema.optional(ReasoningMode),
  fast: Schema.Boolean,
  pro: Schema.Boolean,
  ultrafast: Schema.optional(Schema.Boolean),
  daybreak: Schema.optional(Schema.Unknown),
  limits: Schema.Struct({ context: Schema.Number, output: Schema.Number }),
  pricing: Schema.optional(
    Schema.Struct({
      input: Schema.Number,
      output: Schema.Number,
      cacheRead: Schema.optional(Schema.Number),
    }),
  ),
  knowledgeCutoff: Schema.optional(Schema.String),
  route: Schema.optional(Schema.Unknown),
  replaces: Schema.optional(Schema.Array(Schema.String)),
  aliasOf: Schema.optional(Schema.String),
  ads: Schema.optional(Schema.Boolean),
  unavailable: Schema.optional(Schema.Literal("region")),
}) {}
