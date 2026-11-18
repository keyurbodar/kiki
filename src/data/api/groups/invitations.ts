import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/http-api";
import { Undecoded } from "../undecoded.ts";

export class InvitationsGroup extends HttpApiGroup.make("invitations").add(
  HttpApiEndpoint.post(
    "acceptInvitation",
    "/invitations/:invitationId/accept",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { invitationId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("listInvitations", "/orgs/:orgId/invitations", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "revokeInvitation",
    "/orgs/:orgId/invitations/:invitationId/revoke",
    {
      error: HttpApiError.NotFoundNoContent,
      params: { orgId: Schema.String, invitationId: Schema.String },
      success: Undecoded,
    },
  ),
) {}
