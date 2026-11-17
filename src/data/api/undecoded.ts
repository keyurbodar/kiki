import { Schema } from "effect";

export const Undecoded = Schema.Unknown.annotate({ identifier: "Undecoded" });

export const UndecodedQuery = Schema.Record(
  Schema.String,
  Schema.Union([Schema.String, Schema.Array(Schema.String)]),
).annotate({ identifier: "UndecodedQuery" });
