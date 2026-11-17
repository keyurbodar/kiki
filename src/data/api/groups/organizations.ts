import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Forbidden } from "../schemas/errors.ts";
import { OrgId } from "../schemas/ids.ts";
import { Organization } from "../schemas/organization.ts";
import { Undecoded } from "../undecoded.ts";

export class OrganizationsGroup extends HttpApiGroup.make("organizations").add(
  HttpApiEndpoint.get("listMyInvitations", "/me/invitations", {
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "listJoinableOrganizations",
    "/me/joinable-organizations",
    { success: Undecoded },
  ),
  HttpApiEndpoint.get("list", "/organizations", {
    success: Schema.Array(Organization),
  }),
  HttpApiEndpoint.post("create", "/organizations", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listDeleted", "/organizations/deleted", {
    success: Undecoded,
  }),
  HttpApiEndpoint.get("get", "/orgs/:orgId", {
    params: { orgId: OrgId },
    success: Organization,
    error: Forbidden,
  }),
  HttpApiEndpoint.get("listAllowedDomains", "/orgs/:orgId/allowed-domains", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("addAllowedDomain", "/orgs/:orgId/allowed-domains", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "removeAllowedDomain",
    "/orgs/:orgId/allowed-domains/:domainId",
    {
      params: { orgId: Schema.String, domainId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setAllowedDomainSsoRequired",
    "/orgs/:orgId/allowed-domains/:domainId/sso-requirement",
    {
      params: { orgId: Schema.String, domainId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "verifyAllowedDomain",
    "/orgs/:orgId/allowed-domains/:domainId/verify",
    {
      params: { orgId: Schema.String, domainId: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setDefaultModel", "/orgs/:orgId/default-model", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "surfaceDefaultModel",
    "/orgs/:orgId/default-models/:surface",
    {
      params: { orgId: Schema.String, surface: Schema.String },
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setSurfaceDefaultModel",
    "/orgs/:orgId/default-models/:surface",
    {
      params: { orgId: Schema.String, surface: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "listDepartedPrivateWork",
    "/orgs/:orgId/departed-private-work",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.post("joinByDomain", "/orgs/:orgId/join-by-domain", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setDefaultProject", "/orgs/:orgId/me/default-project", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put(
    "setDefaultVisibility",
    "/orgs/:orgId/me/default-visibility",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setTitlePrompt", "/orgs/:orgId/me/title-prompt", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setTitleTriggers", "/orgs/:orgId/me/title-triggers", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "transferPrivateWork",
    "/orgs/:orgId/members/:userId/private-work/transfer",
    {
      params: { orgId: Schema.String, userId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setMfaRequired", "/orgs/:orgId/mfa-requirement", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setPersonalThreads", "/orgs/:orgId/personal-threads", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setPullGuides", "/orgs/:orgId/pull-guides", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setSharing", "/orgs/:orgId/sharing", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("getSsoConnection", "/orgs/:orgId/sso-connection", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("connectSsoConnection", "/orgs/:orgId/sso-connection", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete(
    "disconnectSsoConnection",
    "/orgs/:orgId/sso-connection",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.patch(
    "configureSsoConnection",
    "/orgs/:orgId/sso-connection",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "setSsoConnectionActive",
    "/orgs/:orgId/sso-connection/active",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "addSsoCertificate",
    "/orgs/:orgId/sso-connection/certificates",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "draftSsoConnection",
    "/orgs/:orgId/sso-connection/draft",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put("setOrgSsoRequired", "/orgs/:orgId/sso-requirement", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setTaskLimits", "/orgs/:orgId/task-limits", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setOrgTitlePrompt", "/orgs/:orgId/title-prompt", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setOrgTitleTriggers", "/orgs/:orgId/title-triggers", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
