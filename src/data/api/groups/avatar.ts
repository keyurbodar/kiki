import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class AvatarGroup extends HttpApiGroup.make("avatar").add(
  HttpApiEndpoint.put("updateAvatar", "/orgs/:orgId/avatar", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("removeAvatar", "/orgs/:orgId/avatar", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("presignAvatarUpload", "/orgs/:orgId/avatar/upload", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
