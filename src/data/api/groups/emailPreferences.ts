import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  EmailPreferencesState,
  EmailProgram,
  EmailSubscription,
} from "../schemas/emailPreferences.ts";

export class EmailPreferencesGroup extends HttpApiGroup.make(
  "emailPreferences",
).add(
  HttpApiEndpoint.get("get", "/me/email-preferences", {
    success: EmailPreferencesState,
  }),
  HttpApiEndpoint.put("setMarketing", "/me/email-preferences/marketing", {
    payload: EmailSubscription,
    success: EmailPreferencesState,
  }),
  HttpApiEndpoint.put("setNotice", "/me/email-preferences/notices/:template", {
    params: { template: Schema.String },
    payload: EmailSubscription,
    success: EmailPreferencesState,
  }),
  HttpApiEndpoint.put("setProgram", "/me/email-preferences/programs/:program", {
    params: { program: EmailProgram },
    payload: EmailSubscription,
    success: EmailPreferencesState,
  }),
) {}
