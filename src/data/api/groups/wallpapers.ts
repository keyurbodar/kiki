import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class WallpapersGroup extends HttpApiGroup.make("wallpapers").add(
  HttpApiEndpoint.get("list", "/me/wallpapers", { success: Undecoded }),
  HttpApiEndpoint.post("upload", "/me/wallpapers", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("remove", "/me/wallpapers/:wallpaperId", {
    params: { wallpaperId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("background", "/me/wallpapers/:wallpaperId/background", {
    params: { wallpaperId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("image", "/me/wallpapers/:wallpaperId/image", {
    params: { wallpaperId: Schema.String },
    success: Undecoded,
  }),
) {}
