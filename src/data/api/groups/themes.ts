import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class ThemesGroup extends HttpApiGroup.make("themes").add(
  HttpApiEndpoint.get("list", "/me/themes", { success: Undecoded }),
  HttpApiEndpoint.post("create", "/me/themes", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("update", "/me/themes/:themeId", {
    params: { themeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("remove", "/me/themes/:themeId", {
    params: { themeId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("publish", "/me/themes/:themeId/publish", {
    params: { themeId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("unpublish", "/me/themes/:themeId/unpublish", {
    params: { themeId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("publications", "/me/themes/publications", {
    success: Undecoded,
  }),
) {}
