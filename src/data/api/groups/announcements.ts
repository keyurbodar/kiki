import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class AnnouncementsGroup extends HttpApiGroup.make("announcements").add(
  HttpApiEndpoint.get("list", "/me/announcements", {
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("record", "/me/announcements/:key", {
    params: { key: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
