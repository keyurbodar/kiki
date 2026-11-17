import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class InvitationsGroup extends HttpApiGroup.make("invitations").add(
  HttpApiEndpoint.post(
    "acceptInvitation",
    "/invitations/:invitationId/accept",
    { params: { invitationId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.get("listInvitations", "/orgs/:orgId/invitations", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "revokeInvitation",
    "/orgs/:orgId/invitations/:invitationId/revoke",
    {
      params: { orgId: Schema.String, invitationId: Schema.String },
      success: Undecoded,
    },
  ),
) {}
