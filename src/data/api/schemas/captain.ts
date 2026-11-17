import { Schema } from "effect";
import { ThreadCollectionCard } from "./thread.ts";

export const CaptainAvatar = Schema.Struct({
  kind: Schema.Literals(["preset", "emoji"]),
  value: Schema.String,
  background: Schema.String,
  image: Schema.optional(Schema.String),
  library: Schema.optional(Schema.String),
}).annotate({ identifier: "CaptainAvatar" });

export const CaptainCardFace = Schema.Struct({
  name: Schema.String,
  avatar: CaptainAvatar,
  description: Schema.NullOr(Schema.String),
}).annotate({ identifier: "CaptainCardFace" });

export class CaptainCard extends Schema.Class<CaptainCard>("CaptainCard")({
  ...ThreadCollectionCard.fields,
  face: CaptainCardFace,
}) {}

export const CaptainListScope = Schema.Literals(["member", "visible"]);
