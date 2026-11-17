import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class EmailPreferencesGroup extends HttpApiGroup.make(
  "emailPreferences",
).add(
  HttpApiEndpoint.get("get", "/me/email-preferences", { success: Undecoded }),
  HttpApiEndpoint.put("setMarketing", "/me/email-preferences/marketing", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setNotice", "/me/email-preferences/notices/:template", {
    params: { template: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setProgram", "/me/email-preferences/programs/:program", {
    params: { program: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
